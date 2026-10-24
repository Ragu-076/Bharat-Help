$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
[Windows.Globalization.Language, Windows.Globalization, ContentType=WindowsRuntime] | Out-Null
$taskMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
} | Select-Object -First 1
function Get-AsyncResult($operation, [type]$resultType) {
    $task = $taskMethod.MakeGenericMethod($resultType).Invoke($null, @($operation))
    $task.Wait()
    return $task.Result
}
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$processedPath = Join-Path $projectRoot 'datasets\real-data\processed'
$manifestPath = Join-Path $processedPath 'ocr-manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
if ($null -eq $engine) { throw 'An English OCR engine is not installed.' }
$results = @()
foreach ($entry in $manifest) {
    $file = Get-AsyncResult ([Windows.Storage.StorageFile]::GetFileFromPathAsync($entry.image)) ([Windows.Storage.StorageFile])
    $stream = Get-AsyncResult ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    try {
        $decoder = Get-AsyncResult ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $bitmap = Get-AsyncResult ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
        try {
            $ocr = Get-AsyncResult ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
            $results += [PSCustomObject]@{ document=$entry.document; page=$entry.page; text=$ocr.Text; language='en-US' }
        } finally { $bitmap.Dispose() }
    } finally { $stream.Dispose() }
}
$results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $processedPath 'ocr-results.json') -Encoding UTF8
Write-Output "$($results.Count) pages recognized with the installed English OCR engine."
