resource "aws_route53_record" "web" {
  zone_id         = data.aws_route53_zone.apex.zone_id
  name            = local.fqdn
  type            = "A"
  allow_overwrite = true # take over the legacy OVH-era A record on first apply

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
