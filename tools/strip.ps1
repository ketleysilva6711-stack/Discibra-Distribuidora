param([string]$Dir, [string]$Out)

Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

function Load-Bmp([string]$p) {
  $b   = [System.IO.File]::ReadAllBytes($p)
  $ms  = [System.IO.MemoryStream]::new($b)
  $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($ms, [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
  return [System.Windows.Media.Imaging.FormatConvertedBitmap]::new($dec.Frames[0], [System.Windows.Media.PixelFormats]::Bgra32, $null, 0)
}

function Txt($dc, [string]$t, [double]$x, [double]$y, [double]$size, $color, [bool]$bold) {
  $fw = if ($bold) { [System.Windows.FontWeights]::Bold } else { [System.Windows.FontWeights]::Normal }
  $tf = [System.Windows.Media.Typeface]::new("Arial", [System.Windows.FontStyles]::Normal, $fw, [System.Windows.FontStretches]::Normal)
  $br = [System.Windows.Media.SolidColorBrush]::new($color)
  $ft = [System.Windows.Media.FormattedText]::new($t, [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $tf, $size, $br, 1.0)
  $dc.DrawText($ft, [System.Windows.Point]::new($x, $y))
}

$files = Get-ChildItem $Dir -File -Filter "banner-*.jpg" | Sort-Object Name
$CROP_H = 120; $Z = 1.7; $PAD = 10; $LAB = 26
$ZW = [int](1920 * $Z); $ZH = [int]($CROP_H * $Z)
$W = $ZW + $PAD*2
$H = $files.Count * ($ZH + $LAB + $PAD) + $PAD

$dv = [System.Windows.Media.DrawingVisual]::new(); $dc = $dv.RenderOpen()
$dc.DrawRectangle([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(13,16,21)), $null, [System.Windows.Rect]::new(0,0,$W,$H))
$i = 0
foreach ($f in $files) {
  $bmp = Load-Bmp $f.FullName
  $y0 = [Math]::Max(0, $bmp.PixelHeight - $CROP_H)
  $cb = [System.Windows.Media.Imaging.CroppedBitmap]::new($bmp, [System.Windows.Int32Rect]::new(0, $y0, $bmp.PixelWidth, $CROP_H))
  $y = $PAD + $i * ($ZH + $LAB + $PAD)
  $dc.DrawImage($cb, [System.Windows.Rect]::new($PAD, $y, $ZW, $ZH))
  Txt $dc $f.Name $PAD ($y + $ZH + 3) 15 ([System.Windows.Media.Color]::FromRgb(240,124,31)) $true
  $i++
}
$dc.Close()
$rtb = [System.Windows.Media.Imaging.RenderTargetBitmap]::new($W, $H, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32); $rtb.Render($dv)
$enc = [System.Windows.Media.Imaging.PngBitmapEncoder]::new(); $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
$fs = [System.IO.File]::Create($Out); $enc.Save($fs); $fs.Close(); $fs.Dispose()
Write-Host "RODAPE -> $Out"