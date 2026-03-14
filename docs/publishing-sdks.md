# Publishing SDKs to NPM and PyPI

Steps to publish the Node and Python SDKs. Version numbers should align with `config/openapi-version.txt` (see [sdk-versioning.md](sdk-versioning.md)).

---

## NPM (`@poofmq/node`)

### Prerequisites

- NPM account (you have one).
- For the **scoped** name `@poofmq/node`, either:
  - Create an **organization** named `poofmq` on [npmjs.com](https://www.npmjs.com/org/create), then add your user; or
  - Publish under your user scope (e.g. `@your-username/poofmq-node`) and set `"name": "@your-username/poofmq-node"` in `sdks/node/package.json`.

### Steps

1. **Log in to NPM** (from any directory):
   ```bash
   npm login
   ```
   Use your npm username, password, and email (or use a token).

2. **From repo root, build and publish the Node SDK**:
   ```bash
   cd sdks/node
   npm run build
   npm publish --access public
   ```
   `--access public` is required for scoped packages (`@poofmq/node`) so they are publicly installable. The `prepack` script runs `npm run build` automatically when you run `npm publish`, but building first lets you verify the build.

3. **Subsequent releases**: bump `version` in `sdks/node/package.json` (and keep in sync with `config/openapi-version.txt` if you follow the versioning doc), then run `npm publish --access public` again from `sdks/node`.

### Optional

- **2FA**: Enable two-factor auth on npm for account security.
- **CI**: Use `NPM_TOKEN` (from npm Account → Access Tokens) in CI and run `npm publish --access public` from `sdks/node` in a release job.

---

## PyPI (`poofmq`)

### Prerequisites

- PyPI account: [pypi.org](https://pypi.org) → Register.
- (Recommended) API token: Account → API tokens → Add API token (scope: entire account or just project `poofmq`).

### Steps

1. **Install build and upload tools** (one-time):
   ```bash
   pip install build twine
   ```
   Or with uv: `uv tool install build twine`.

2. **Build the Python package** (from repo root):
   ```bash
   cd sdks/python
   python -m build
   ```
   This creates `sdks/python/dist/` with a `.tar.gz` (sdist) and a `.whl` (wheel).

3. **Upload to PyPI**:
   ```bash
   twine upload dist/*
   ```
   Twine will prompt for username and password. For username use `__token__`; for password use your PyPI API token (including the `pypi-` prefix).

4. **First-time only**: The first publish will create the project `poofmq` on PyPI. Later publishes must use a **new version** each time (bump `version` in `sdks/python/pyproject.toml`).

### Optional: config file (no prompts)

Create `~/.pypirc`:

```ini
[distutils]
index-servers =
    pypi

[pypi]
username = __token__
password = pypi-YOUR_API_TOKEN_HERE
```

Then run `twine upload dist/*` with no prompts. Keep this file secure and out of version control.

### TestPyPI (optional dry run)

To test without publishing to real PyPI:

```bash
cd sdks/python
python -m build
twine upload --repository testpypi dist/*
```

Install from TestPyPI: `pip install --index-url https://test.pypi.org/simple/ poofmq`.

---

## Version alignment

- **API/SDK version**: Kept in `config/openapi-version.txt` (e.g. `1.0.0`).
- **Node**: Bump `version` in `sdks/node/package.json` to match before `npm publish`.
- **Python**: Bump `version` in `sdks/python/pyproject.toml` to match before `python -m build` and `twine upload`.

See [sdk-versioning.md](sdk-versioning.md) for when to bump major/minor/patch.
