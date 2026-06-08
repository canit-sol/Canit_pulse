import requests

# X (Twitter) API v2 Base URL
BASE_URL = "https://api.twitter.com/2"

def get_client_twitter_stats(client_keys: dict, **kwargs) -> dict:
    user_id = client_keys.get("x_user_id")
    token = client_keys.get("x_token")
    handle = client_keys.get("instagram_handle", "Client")

    if not user_id or not token:
        return {"platform": "x", "status": "not_connected"}

    try:
        url = f"{BASE_URL}/users/{user_id}"
        res = requests.get(url,
            headers={"Authorization": f"Bearer {token}"},
            params={"user.fields": "public_metrics,description,username"}
        ).json()

        # Handle credits depleted
        if "title" in res and "Credits" in res.get("title", ""):
            return {"platform": "x", "status": "credits_depleted"}

        if "errors" in res or "error" in res:
            return {"platform": "x", "status": "error", "error": str(res)}

        data = res.get("data", {})
        metrics = data.get("public_metrics", {})
        return {
            "platform": "x",
            "status": "success",
            "username": data.get("username"),
            "followers": metrics.get("followers_count", 0),
            "following": metrics.get("following_count", 0),
            "total_tweets": metrics.get("tweet_count", 0),
        }
    except Exception as e:
        return {"platform": "x", "status": "error", "error": str(e)}