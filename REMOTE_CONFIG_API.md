## How the Handshake will Works with Applications 

DASHBOARD (Admin)
  1. Create Project → dev / staging / prod environments auto-created
  2. Create App in an environment → API key generated: rc_live_xxxx
  3. Create Parameters and publish them

        API key is embedded in your app at build time
                          │
                          ▼
YOUR APP (on launch)
  GET /config?userId=u123&platform=ios&country=PK&appVersion=2.1
  X-API-Key: rc_live_a1b2c3d4e5f6g7h8

← {
    "dark_mode": "false",
    "button_color": "blue",
    "font_color": "black"
  }


The API key identifies which **App → Environment** the request comes from.  
The backend resolves: `API Key → App → Environment → all published Parameters`

## Authentication

App routes use `X-API-Key` only. No JWT, no user login required.

```
X-API-Key:
```

Get this key from the **Apps** page in the dashboard.

---

## GET /config — Fetch Config

```
GET /config?userId=<id>&platform=<val>&country=<val>&appVersion=<val>
X-API-Key: rc_live_a1b2c3d4e5f6g7h8
```

**Query parameters:**

| Param | Required | Description |
|---|---|---|
| `userId` | Recommended | Your user's unique ID. Required for A/B bucketing. |
| `platform` | Optional | `ios`, `android`, `web` — used in condition rules |
| `country` | Optional | ISO country code e.g. `PK`, `US` — used in condition rules |
| `appVersion` | Optional | Your app version string e.g. `2.1.0` |

**Response `200`:**
```json
{
  "<your_param_key>": "<published_value>",
  "<your_param_key>": "<published_value>"
}
```

The keys and values are exactly what you created and published in the dashboard for that environment. Example — if you created `dark_mode = false` and `button_color = blue` and published them, you get:
```json
{
  "dark_mode": "false",
  "button_color": "blue"
}
```

All values are **strings**. Cast in your app:
- Boolean → `value === "true"`
- Number → `Number(value)`
- JSON → `JSON.parse(value)`

**Response `401`** — bad or missing API key:
```json
{ "error": "Invalid API key" }
```

### Value resolution order

For each parameter the backend resolves in this order:

```
1. Running experiment variant   ← wins if experiment is active for this param
2. Condition override value     ← wins if a condition rule matches the request context
3. Published default value      ← fallback
```

---

## POST /config/event — Track Conversion

Call this when a user completes a goal (purchase, click, signup) during an experiment.

```
POST /config/event
X-API-Key: rc_live_a1b2c3d4e5f6g7h8
Content-Type: application/json

{
  "userId": "user_123",
  "experimentId": 1,
  "variantId": 2
}
```

**Response `200`:**
```json
{ "success": true }
```

---

## SDK Examples

### JavaScript / TypeScript

```typescript
const BASE_URL = "https://your-backend.com";
const API_KEY  = "rc_live_a1b2c3d4e5f6g7h8";

async function fetchConfig(userId: string): Promise<Record<string, string>> {
  const params = new URLSearchParams({ userId, platform: "web", appVersion: "1.0.0", country: "PK" });
  const res = await fetch(`${BASE_URL}/config?${params}`, {
    headers: { "X-API-Key": API_KEY },
  });
  if (!res.ok) throw new Error("Failed to fetch config");
  return res.json();
}

async function trackConversion(userId: string, experimentId: number, variantId: number) {
  await fetch(`${BASE_URL}/config/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify({ userId, experimentId, variantId }),
  });
}

const config = await fetchConfig("user_123");
const isDarkMode  = config.dark_mode === "true";
const maxRetries  = Number(config.max_retries ?? "3");

```

### Android (Kotlin)

```kotlin
object RemoteConfig {
    private const val BASE_URL = "https://your-backend.com"
    private const val API_KEY  = "rc_live_a1b2c3d4e5f6g7h8"

    private var config: Map<String, String> = emptyMap()

    suspend fun fetch(userId: String) {
        val url = "$BASE_URL/config?userId=$userId&platform=android" +
                  "&country=PK&appVersion=${BuildConfig.VERSION_NAME}"
        val request = Request.Builder()
            .url(url)
            .addHeader("X-API-Key", API_KEY)
            .build()
        val body = OkHttpClient().newCall(request).execute().body?.string() ?: return
        config = JSONObject(body).keys().asSequence().associateWith { JSONObject(body).getString(it) }
    }

    fun getString(key: String, default: String = "")   = config[key] ?: default
    fun getBoolean(key: String, default: Boolean = false) = config[key]?.toBooleanStrictOrNull() ?: default
    fun getInt(key: String, default: Int = 0)           = config[key]?.toIntOrNull() ?: default

    suspend fun trackConversion(userId: String, experimentId: Int, variantId: Int) {
        val body = """{"userId":"$userId","experimentId":$experimentId,"variantId":$variantId}"""
            .toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url("$BASE_URL/config/event")
            .addHeader("X-API-Key", API_KEY)
            .post(body)
            .build()
        OkHttpClient().newCall(request).execute()
    }
}

// In Application.onCreate() or MainActivity
lifecycleScope.launch {
    RemoteConfig.fetch(currentUser.id)
    applyDarkMode(RemoteConfig.getBoolean("dark_mode"))
}
```

### iOS (Swift)

```swift
class RemoteConfig {
    static let shared = RemoteConfig()
    private let baseURL   = "https://your-backend.com"
    private let apiKey    = "rc_live_a1b2c3d4e5f6g7h8"
    private var config: [String: String] = [:]

    func fetch(userId: String) async {
        var comps = URLComponents(string: "\(baseURL)/config")!
        comps.queryItems = [
            URLQueryItem(name: "userId",     value: userId),
            URLQueryItem(name: "platform",   value: "ios"),
            URLQueryItem(name: "country",    value: Locale.current.region?.identifier ?? ""),
            URLQueryItem(name: "appVersion", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? ""),
        ]
        var req = URLRequest(url: comps.url!)
        req.addValue(apiKey, forHTTPHeaderField: "X-API-Key")
        guard let (data, _) = try? await URLSession.shared.data(for: req),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: String]
        else { return }
        config = json
    }

    func string(_ key: String, default d: String = "")   -> String  { config[key] ?? d }
    func bool(_ key: String,   default d: Bool = false)  -> Bool    { Bool(config[key] ?? "") ?? d }
    func int(_ key: String,    default d: Int = 0)       -> Int     { Int(config[key] ?? "") ?? d }

    func trackConversion(userId: String, experimentId: Int, variantId: Int) async {
        var req = URLRequest(url: URL(string: "\(baseURL)/config/event")!)
        req.httpMethod = "POST"
        req.addValue("application/json", forHTTPHeaderField: "Content-Type")
        req.addValue(apiKey, forHTTPHeaderField: "X-API-Key")
        req.httpBody = try? JSONSerialization.data(withJSONObject: [
            "userId": userId, "experimentId": experimentId, "variantId": variantId
        ])
        _ = try? await URLSession.shared.data(for: req)
    }
}

// In AppDelegate / SceneDelegate
Task {
    await RemoteConfig.shared.fetch(userId: currentUser.id)
    applyTheme(RemoteConfig.shared.bool("dark_mode"))
}
```

---

## Postman Quick Test

1. Get your API key from the **Apps** page in the dashboard
2. Create a request:

```
GET http://localhost:5000/config?userId=test_001&platform=ios&country=PK
X-API-Key: rc_live_yourkeyhere
```

3. Should return all published parameters for that environment.

4. Test condition targeting — change `platform=android` and verify a param with an iOS condition returns the default instead of the override.

5. Test A/B — call with different `userId` values. Same userId always gets the same variant.
