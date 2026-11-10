# Architecture rules

- Keep installed app icon artwork separate from transparent in-app mascots; Apple renders transparent icon pixels with an unwanted background.
- Version replaced installed icons and social share images with new filenames so existing browser and social caches can distinguish them.
- Note-writing functions call OpenAI directly with the server-held OPENAI_API_KEY and no gateway fallback, so a missing key cannot silently bill workspace credits; image generation remains independent.