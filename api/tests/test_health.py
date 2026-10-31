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
