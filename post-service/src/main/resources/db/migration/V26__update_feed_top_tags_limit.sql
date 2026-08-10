-- Update feed.top_tags_limit from 5 to 10
-- Reason: Sliding Window now keeps a maximum of 20 tags per user in user_interests.
-- topTagsLimit is used for feed query (IN clause), 10 is a good balance between
-- feed diversity and query performance.
UPDATE feed_scoring_config
SET config_value = 10.0,
    description  = 'Max tags used for personalized feed query (IN clause). User interests are stored up to 20 tags; this limits how many are used per request.'
WHERE config_key = 'feed.top_tags_limit';
