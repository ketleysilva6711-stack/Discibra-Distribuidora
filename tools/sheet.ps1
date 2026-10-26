param([string]$Dir, [string]$Out)

Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

function Load-Bmp([string]$p) {
  $b   = [System.IO.File]::ReadAllBytes($p)
  $ms  = [System.IO.MemoryStream]::new($b)
  $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($ms, [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
  $f   = $dec.Frames[0]
  return [System.Windows.Media.Imaging.FormatConvertedBitmap]::new($f, [System.Windows.Media.PixelFormats]::Bgra32, $null, 0)
}

function Draw-Text($dc, [string]$text, [double]$x, [double]$y, [double]$size, $color, [bool]$bold) {
  $fw = if ($bold) { [System.Windows.FontWeights]::Bold } else { [System.Windows.FontWeights]::Normal }
  $tf = [System.Windows.Media.Typeface]::new("Arial", [System.Windows.FontStyles]::Normal, $fw, [System.Windows.FontStretches]::Normal)
  $br = [System.Windows.Media.SolidColorBrush]::new($color)
  $ft = [System.Windows.Media.FormattedText]::new($text, [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $tf, $size, $br, 1.0)
  $dc.DrawText($ft, [System.Windows.Point]::new($x, $y))
}

$files = Get-ChildItem $Dir -File -Filter "imgi_*" |
         Where-Object { $_.Name -notmatch 'avatar' } |
         Sort-Object { [int]([regex]::Match($_.Name,'imgi_(\d+)').Groups[1].Value) }

$TW = 900; $TH = 202; $PAD = 12; $LAB = 34; $COLS = 2
$rows = [math]::Ceiling($files.Count / $COLS)
$W = $COLS * ($TW + $PAD) + $PAD
$H = $rows * ($TH + $LAB + $PAD) + $PAD

$dv = [System.Windows.Media.DrawingVisual]::new()
$dc = $dv.RenderOpen()
$dc.DrawRectangle([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(13,16,21)), $null, [System.Windows.Rect]::new(0,0,$W,$H))

$gridPen = [System.Windows.Media.Pen]::new([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(160,0,229,138)), 1)
$green  = [System.Windows.Media.Color]::FromRgb(0,229,138)
$orange = [System.Windows.Media.Color]::FromRgb(240,124,31)
$gray   = [System.Windows.Media.Color]::FromRgb(201,212,224)

$i = 0
foreach ($f in $files) {
  $col = $i % $COLS; $row = [math]::Floor($i / $COLS)
  $x = $PAD + $col * ($TW + $PAD)
  $y = $PAD + $row * ($TH + $LAB + $PAD)
  try {
    $bmp = Load-Bmp $f.FullName
    Write-Host ("{0}  {1}x{2}" -f $f.Name, $bmp.PixelWidth, $bmp.PixelHeight)
    $dc.DrawImage($bmp, [System.Windows.Rect]::new($x, $y, $TW, $TH))
    for ($k=1; $k -lt 10; $k++) {
      $gx = $x + $TW*$k/10; $gy = $y + $TH*$k/10
      $dc.DrawLine($gridPen, [System.Windows.Point]::new($gx,$y), [System.Windows.Point]::new($gx,$y+$TH))
      $dc.DrawLine($gridPen, [System.Windows.Point]::new($x,$gy), [System.Windows.Point]::new($x+$TW,$gy))
      Draw-Text $dc ([string]($k*10)) ($gx+2) ($y+1) 10 $green $true
      Draw-Text $dc ([string]($k*10)) ($x+2) ($gy-13) 10 $green $true
    }
    $n = [regex]::Match($f.Name,'imgi_(\d+)').Groups[1].Value
    Draw-Text $dc ("BANNER " + $n) $x ($y+$TH+3) 18 $orange $true
    Draw-Text $dc ($f.Name.Substring(0,[Math]::Min(40,$f.Name.Length))) ($x+120) ($y+$TH+9) 11 $gray $false
  } catch {
    Draw-Text $dc ("ERRO: " + $_.Exception.Message) ($x+4) ($y+4) 12 $orange $false
  }
  $i++
}
$dc.Close()

$rtb = [System.Windows.Media.Imaging.RenderTargetBitmap]::new($W, $H, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
$rtb.Render($dv)
$enc = [System.Windows.Media.Imaging.PngBitmapEncoder]::new()
$enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
$fs = [System.IO.File]::Create($Out); $enc.Save($fs); $fs.Close(); $fs.Dispose()
Write-Host "SHEET -> $Out"