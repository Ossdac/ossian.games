<#
  Resize an image and save it as a JPEG, using only what ships with Windows.

    pwsh tools/compress-image.ps1 assets/img/thrall/closing.png
    pwsh tools/compress-image.ps1 shot.png -MaxWidth 1200 -Quality 86 -OutFile assets/img/x/shot.jpg
    pwsh tools/compress-image.ps1 shot.png -CropAspect 1.91 -FocusY 0.4 -MaxWidth 1200 -OutFile og.jpg

  -MaxWidth    Images wider than this are scaled down (never up). 1600 suits figures,
               1200 suits cards, 1100 suits project hero images.
  -Quality     JPEG quality, 1-100. 82-88 is a good range for screenshots.
  -CropAspect  Optional width/height ratio to crop to first (1.91 = social preview image).
  -FocusY      Where to centre a vertical crop: 0 = top, 0.5 = middle, 1 = bottom.
  -OutFile     Defaults to the same name with a .jpg extension.
#>
param(
  [Parameter(Mandatory = $true)] [string] $Path,
  [int] $MaxWidth = 1600,
  [ValidateRange(1, 100)] [int] $Quality = 84,
  [double] $CropAspect = 0,
  [ValidateRange(0.0, 1.0)] [double] $FocusY = 0.5,
  [string] $OutFile
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$inPath = (Resolve-Path $Path).Path
if (-not $OutFile) { $OutFile = [System.IO.Path]::ChangeExtension($inPath, ".jpg") }
$outPath = [System.IO.Path]::GetFullPath($OutFile)
if ($outPath -eq $inPath) { throw "Output would overwrite the input: $outPath" }

$src = [System.Drawing.Image]::FromFile($inPath)
try {
  # Source rectangle: the whole image, or a crop to the requested aspect ratio.
  $sx = 0; $sy = 0; $sw = $src.Width; $sh = $src.Height
  if ($CropAspect -gt 0) {
    if ($sw / $sh -gt $CropAspect) {
      $sw = [int][Math]::Round($sh * $CropAspect)
      $sx = [int](($src.Width - $sw) / 2)
    } else {
      $sh = [int][Math]::Round($sw / $CropAspect)
      $sy = [int][Math]::Round(($src.Height - $sh) * $FocusY)
    }
  }

  $scale = [Math]::Min(1.0, $MaxWidth / $sw)
  $w = [int][Math]::Round($sw * $scale)
  $h = [int][Math]::Round($sh * $scale)

  $dst = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($dst)
  $attr = New-Object System.Drawing.Imaging.ImageAttributes
  try {
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    # Without this, bicubic scaling pulls a dark halo in from outside the image edges.
    $attr.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), $sx, $sy, $sw, $sh,
      [System.Drawing.GraphicsUnit]::Pixel, $attr)

    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
    $params = New-Object System.Drawing.Imaging.EncoderParameters 1
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$Quality)
    $dst.Save($outPath, $codec, $params)
  } finally {
    $attr.Dispose(); $g.Dispose(); $dst.Dispose()
  }
} finally {
  $src.Dispose()
}

$before = (Get-Item $inPath).Length
$after = (Get-Item $outPath).Length
"{0}  {1}x{2}  {3:N0} KB -> {4:N0} KB" -f (Split-Path $outPath -Leaf), $w, $h, ($before / 1KB), ($after / 1KB)
