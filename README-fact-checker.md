# Biographical Fact-Checking Script

## Overview
This script automatically fact-checks biographical data in test datasets against their reference sources using either HuggingFace API (recommended) or local AI models via Ollama.

## Features
- ✅ **HuggingFace Integration**: Fast cloud-based fact-checking with `meta-llama/Llama-3.1-8B-Instruct`
- 🔧 **Ollama Support**: Local processing with `bespoke-minicheck:7b` for offline usage
- 📊 Processes both datasets sequentially with natural rate limiting
- 📝 Generates CSV report with errors only (legitimate entries omitted)
- 🛡️ Handles unreachable URLs and unreadable content
- 🧪 **Comprehensive Test Suite**: 3 test cases to validate fact-checking accuracy

## Prerequisites

### Option 1: HuggingFace API (Recommended - Fast)

1. **Get a HuggingFace API Key**:
   - Visit https://huggingface.co/settings/tokens
   - Create a new token with "Read" permission

2. **Set up environment**:
   ```bash
   echo "HUGGING_FACE_API_KEY=your_key_here" > .env
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

### Option 2: Local Ollama (Slower but offline)

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

### Basic Commands

```bash
cd test-data-api

# Use HuggingFace (default if API key is present)
node scripts/fact-check-bios.js <dataset-path> [dataset-name]

# Force HuggingFace usage
node scripts/fact-check-bios.js --huggingface <dataset-path> [dataset-name]

# Force local Ollama usage
node scripts/fact-check-bios.js --local <dataset-path> [dataset-name]
```

### Examples

Check a single dataset with HuggingFace:
```bash
node scripts/fact-check-bios.js ../stem-achievements-data/dist/index.js stem-achievements
```

Check multiple datasets:
```bash
node scripts/fact-check-bios.js ../first-nations-activists-data/dist/index.js first-nations-activists ../stem-achievements-data/dist/index.js stem-achievements
```

Force local Ollama usage:
```bash
node scripts/fact-check-bios.js --local ../stem-achievements-data/dist/index.js
```

## Testing the Fact Checker

Run the comprehensive test suite to validate fact-checking accuracy:

```bash
# Run all 3 test cases
node scripts/fact-checker.test.js
```

The test suite includes:
1. **Absurdly False Claims**: Moon landing, eating children, impossible achievements
2. **Wrong Dates**: Incorrect birth/death dates and chronology
3. **Impossible Achievements**: Anachronistic awards and achievements

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

## Configuration

### API Provider Selection
- **Automatic**: Uses HuggingFace if `HUGGING_FACE_API_KEY` is set, otherwise Ollama
- **Manual**: Use `--huggingface` or `--local` flags to override

### Model Configuration
Edit `scripts/fact-check-bios.js` to change models:

```javascript
// HuggingFace model (fast, requires API key)
const HUGGINGFACE_MODEL = 'meta-llama/Llama-3.1-8B-Instruct';

// Local Ollama model (slower, offline)
const OLLAMA_MODEL = 'bespoke-minicheck:7b';
```

### Alternative Local Models
If using Ollama, you can try different models:

```bash
# For advanced reasoning
ollama pull deepseek-r1:14b

# For mathematical/scientific facts
ollama pull qwen2-math:7b

# For maximum accuracy (requires more resources)
ollama pull reflection:70b
```

## Processing Details

- **HuggingFace**: Fast cloud processing, ~2-3 seconds per person
- **Ollama**: Local processing, ~30-60 seconds per person (CPU-only)
- Processes datasets sequentially to respect rate limits
- 1-second delay between person checks
- 30-second timeout for web requests
- Only flags clear factual contradictions (missing info is OK)
- Uses low temperature (0.1) for consistent fact-checking

## Troubleshooting

### HuggingFace Issues
**"HUGGINGFACE_API_KEY not found"**: 
- Add your API key to `.env` file
- Get a key from https://huggingface.co/settings/tokens

**"No Inference Provider available"**:
- Some models may not be available - the script uses `meta-llama/Llama-3.1-8B-Instruct` which is tested and working

### Ollama Issues
**"Cannot connect to Ollama"**: 
- Ensure Ollama is running: `ollama serve`
- Check model is available: `ollama list`

**"Model not found"**:
- Pull the model: `ollama pull bespoke-minicheck:7b`

### General Issues
**Too many errors**:
- Try running the test suite first: `node scripts/fact-checker.test.js`
- Check if reference URLs are valid
- Consider using HuggingFace for better accuracy

**Script crashes**:
- Check the error message for missing dependencies
- Run `npm install` to ensure all packages are installed

## Performance Comparison

| Provider | Speed per person | Cost | Offline | Setup Complexity |
|----------|------------------|------|---------|------------------|
| HuggingFace | ~2-3 seconds | Free tier | ❌ | Low |
| Local Ollama | ~30-60 seconds | Free | ✅ | Medium |