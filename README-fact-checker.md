# Biographical Fact-Checking Script

## Overview
This script automatically fact-checks biographical data in the test datasets against their reference sources using local AI models via Ollama.

## Features
- ✅ Fetches full web content from reference URLs
- 🤖 Uses `bespoke-minicheck:7b` model (specialized for fact-checking)
- 📊 Processes both datasets sequentially with natural rate limiting
- 📝 Generates CSV report with errors only (legitimate entries omitted)
- 🛡️ Handles unreachable URLs and unreadable content

## Prerequisites

1. **Install Ollama**:
   ```bash
   # Visit https://ollama.com/download or:
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Download the fact-checking model**:
   ```bash
   ollama pull bespoke-minicheck:7b
   ```

3. **Verify Ollama is running**:
   ```bash
   ollama list
   # Should show bespoke-minicheck:7b in the list
   ```

## Usage

```bash
cd test-data-api
node scripts/fact-check-bios.js <dataset-path> [dataset-name] [additional-dataset-path] [dataset-name] ...
```

### Examples

Check a single dataset:
```bash
node scripts/fact-check-bios.js ../first-nations-activists-data/src/index.ts first-nations-activists
```

Check multiple datasets:
```bash
node scripts/fact-check-bios.js ../first-nations-activists-data/src/index.ts first-nations-activists ../stem-achievements-data/src/index.ts stem-achievements
```

If dataset name is omitted, it will be inferred from the path:
```bash
node scripts/fact-check-bios.js ../stem-achievements-data/src/index.ts
```

## Output

The script generates `scripts/fact-check-errors.csv` with these columns:

| Column | Description |
|--------|-------------|
| `dataset` | "first-nations-activists" or "stem-achievements" |
| `person_id` | Person's ID from dataset |
| `person_name` | Full name for identification |
| `error_type` | "factual_error", "url_unreachable", "content_unreadable" |
| `description` | Specific issue found |
| `confidence` | "high", "medium", "low" (LLM confidence) |
| `reference_url` | The reference URL checked |
| `bio_excerpt` | Relevant portion of bio with issue |

## Error Types

- **`factual_error`**: Contradictions between bio and reference source
- **`url_unreachable`**: HTTP errors, timeouts, or missing URLs
- **`content_unreadable`**: Page exists but content can't be extracted

## Alternative Models

If you want to try different models:

```bash
# For advanced reasoning
ollama pull deepseek-r1:14b

# For mathematical/scientific facts
ollama pull qwen2-math:7b

# For maximum accuracy (requires more resources)
ollama pull reflection:70b
```

Then edit the `MODEL_NAME` constant in `fact-check-bios.js`.

## Processing Details

- Processes datasets sequentially to respect rate limits
- 1-second delay between person checks
- 30-second timeout for web requests
- Only flags clear factual contradictions (missing info is OK)
- Uses low temperature (0.1) for consistent fact-checking

## Troubleshooting

**"Cannot connect to Ollama"**: 
- Ensure Ollama is running: `ollama serve`
- Check model is available: `ollama list`

**"Model not found"**:
- Pull the model: `ollama pull bespoke-minicheck:7b`

**Too many errors**:
- Try a different model with higher accuracy
- Check if reference URLs are valid