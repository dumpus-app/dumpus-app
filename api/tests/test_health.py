import socket


def test_health_reports_the_host(client):
    response = client.get('/health')

    assert response.status_code == 200
    assert response.get_json() == {'status': 'alive', 'hostname': socket.gethostname()}


def test_unknown_routes_answer_json_404(client):
    response = client.get('/no-such-route')

    assert response.status_code == 404
    assert response.get_json() == {'error': 'Route not found.'}


def test_wrong_method_answers_405(client):
    response = client.get('/process')

    assert response.status_code == 405
    assert set(response.headers['Allow'].split(', ')) == {'POST', 'OPTIONS'}


def test_responses_allow_any_origin(client):
    # Production sits behind API Gateway, which answers CORS itself: this is
    # what local and Docker deployments send.
    with_origin = client.get('/health', headers={'Origin': 'https://web.dumpus.app'})
    without_origin = client.get('/health')

    assert with_origin.headers['Access-Control-Allow-Origin'] == 'https://web.dumpus.app'
    assert with_origin.headers['Vary'] == 'Origin'
    assert without_origin.headers['Access-Control-Allow-Origin'] == '*'
    assert 'Access-Control-Allow-Credentials' not in with_origin.headers


def test_preflight_allows_the_clients_requests(client):
    response = client.options('/process/0123/status', headers={
        'Origin': 'https://web.dumpus.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization, content-type',
    })

    assert response.status_code == 200
    assert response.headers['Access-Control-Allow-Origin'] == 'https://web.dumpus.app'
    assert set(response.headers['Access-Control-Allow-Methods'].split(', ')) == {
        'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'}
    assert set(response.headers['Access-Control-Allow-Headers'].lower().split(', ')) == {'authorization', 'content-type'}


def test_requests_are_not_rate_limited(client):
    # `Limiter` is set up without any limit, so even a burst on one package goes through.
    statuses = {client.get('/process/0123/status').status_code for _ in range(50)}

    assert statuses == {401}
