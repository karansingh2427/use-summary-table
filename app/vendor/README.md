# Local Vendor Libraries

## Tesseract.js (OCR fallback — R15)

`app/index.html` loads `vendor/tesseract.min.js` for reading scanned, image-only label PDFs.
The library is **bundled locally, not called as an external API** — no data leaves the machine.

If the file is missing the app still runs; pages without a text layer are simply reported as
unreadable in the extraction log.

### To enable OCR

Install with the helper script:

```sh
sh app/vendor/install-tesseract.sh
```

Or download the browser build manually and save it in this folder as `tesseract.min.js`:

<https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js>

```sh
curl -L -o app/vendor/tesseract.min.js \
  https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js
```

On first use Tesseract fetches its English trained-data file and caches it in the browser.
For a fully offline setup, also download the worker, core, and `eng.traineddata.gz` files and
point `Tesseract.createWorker` at local paths in `app/index.html`.
