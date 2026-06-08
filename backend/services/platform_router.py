from instagram import get_client_instagram_stats
from facebook import get_client_facebook_stats
from twitter import get_client_twitter_stats

# Stub for linkedin
def get_client_linkedin_stats(client_keys: dict, **kwargs) -> dict:
    return {"platform": "linkedin", "status": "not_implemented"}

PLATFORM_HANDLERS = {
    "instagram": get_client_instagram_stats,
    "facebook":  get_client_facebook_stats,
    "x":         get_client_twitter_stats,
    "linkedin":  get_client_linkedin_stats,
}

def fetch_platform_data(platform: str, client_keys: dict, month=None, year=None) -> dict:
    handler = PLATFORM_HANDLERS.get(platform)
    if not handler:
        return {"platform": platform, "status": "unsupported"}
    return handler(client_keys, month=month, year=year)

