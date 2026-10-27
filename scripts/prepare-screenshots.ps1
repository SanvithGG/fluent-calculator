Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\sanvi\.gemini\antigravity\brain\e1622555-1d77-489c-ae22-1c1c1c298ac9"
$outDir = [System.IO.Path]::GetTempPath()

$files = @(
    @{ Src = "fullscreen-pro-dark.png"; Dst = "fluent_calc_screen_1.png" },
    @{ Src = "fullscreen-programmer-dark.png"; Dst = "fluent_calc_screen_2.png" },
    @{ Src = "fullscreen-pro-studio.png"; Dst = "fluent_calc_screen_3.png" },
    @{ Src = "fullscreen-fixed.png"; Dst = "fluent_calc_screen_4.png" }
)

foreach ($item in $files) {
    $srcPath = Join-Path $srcDir $item.Src
    $dstPath = Join-Path $outDir $item.Dst

    if (-not (Test-Path $srcPath)) {
        Write-Host "Source not found: $srcPath"
        continue
    }

    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $targetBmp = New-Object System.Drawing.Bitmap(1920, 1080, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($targetBmp)

    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background color matching Windows 11 Mica / Dark background (#18181b)
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 24, 24, 27))
    $g.FillRectangle($bgBrush, 0, 0, 1920, 1080)

    # Draw image centered or scaled to fit 1920x1080 nicely
    # 1200x780 -> aspect ratio 1.538.
    # Scaled to height 1000 -> width is 1538. Centered X is (1920-1538)/2 = 191, Y is 40.
    $destW = 1600
    $destH = 1040
    $destX = [math]::Round((1920 - $destW) / 2)
    $destY = [math]::Round((1080 - $destH) / 2)

    $g.DrawImage($srcImg, $destX, $destY, $destW, $destH)

    $targetBmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $targetBmp.Dispose()
    $srcImg.Dispose()
    $bgBrush.Dispose()

    Write-Host "Saved: $dstPath (1920x1080)"
}
