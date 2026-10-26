param([string]$Dir, [string]$OutDir, [string]$SheetOut, [string]$ZoomOut)

Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$NAVY   = [System.Windows.Media.Color]::FromRgb(15,42,95)
$ORANGE = [System.Windows.Media.Color]::FromRgb(240,124,31)

# ===== TABELA DE COBERTURA (ajustavel) =====
# shape: circle (cx,cy,r) | rect (cx,cy,w,h)
$rules = @(
  @{ m='imgi_3_fd969baa'; shape='circle'; cx=1350; cy=166; r=48 }
  @{ m='imgi_10_fba4ad97';shape='circle'; cx=1720; cy=90;  r=48 }
  @{ m='imgi_6_9c6eff6c'; shape='circle'; cx=1538; cy=370; r=40 }
  @{ m='imgi_9_9d6a2d37'; shape='rect';   cx=215;  cy=85;  w=175; h=62 }
  @{ m='imgi_2_a9cfa2a4'; shape='circle'; cx=915;  cy=42;  r=26 }
  @{ m='imgi_5_2e773153'; shape='circle'; cx=1365; cy=112; r=24 }
  @{ m='imgi_5_d801a316'; shape='circle'; cx=100;  cy=100; r=26 }
  @{ m='imgi_6_9c6eff6c'; shape='circle'; cx=100;  cy=100; r=26 }
  @{ m='imgi_7_916be3fe'; shape='circle'; cx=100;  cy=100; r=26 }
  @{ m='imgi_8_391f0e79'; shape='circle'; cx=1615; cy=140; r=24 }
)

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

function CenterTxt($dc, [string]$t, [double]$cx, [double]$cy, [double]$size, $color, [bool]$bold) {
  $fw = if ($bold) { [System.Windows.FontWeights]::Bold } else { [System.Windows.FontWeights]::Normal }
  $tf = [System.Windows.Media.Typeface]::new("Arial", [System.Windows.FontStyles]::Normal, $fw, [System.Windows.FontStretches]::Normal)
  $br = [System.Windows.Media.SolidColorBrush]::new($color)
  $ft = [System.Windows.Media.FormattedText]::new($t, [System.Globalization.CultureInfo]::InvariantCulture, [System.Windows.FlowDirection]::LeftToRight, $tf, $size, $br, 1.0)
  $dc.DrawText($ft, [System.Windows.Point]::new($cx - $ft.Width/2, $cy - $ft.Height/2))
}

function Draw-Mark($dc, $r) {
  $navyB   = [System.Windows.Media.SolidColorBrush]::new($NAVY)
  $orangeB = [System.Windows.Media.SolidColorBrush]::new($ORANGE)
  $orangeP = [System.Windows.Media.Pen]::new($orangeB, 4)
  $orangeP.StartLineCap = [System.Windows.Media.PenLineCap]::Round
  $orangeP.EndLineCap   = [System.Windows.Media.PenLineCap]::Round

  if ($r.shape -eq 'circle') {
    $cx=[double]$r.cx; $cy=[double]$r.cy; $rad=[double]$r.r
    $dc.DrawEllipse($navyB, $null, [System.Windows.Point]::new($cx,$cy), $rad, $rad)
    $pen = [System.Windows.Media.Pen]::new($orangeB, [Math]::Max(3,$rad*0.16))
    $pen.StartLineCap = [System.Windows.Media.PenLineCap]::Round
    $pen.EndLineCap   = [System.Windows.Media.PenLineCap]::Round
    $dc.DrawLine($pen, [System.Windows.Point]::new($cx-$rad*0.52,$cy-$rad*0.02), [System.Windows.Point]::new($cx,$cy-$rad*0.40))
    $dc.DrawLine($pen, [System.Windows.Point]::new($cx,$cy-$rad*0.40), [System.Windows.Point]::new($cx+$rad*0.52,$cy-$rad*0.02))
    CenterTxt $dc "D" $cx ($cy+$rad*0.26) ($rad*0.95) ([System.Windows.Media.Colors]::White) $true
  } else {
    $cx=[double]$r.cx; $cy=[double]$r.cy; $w=[double]$r.w; $h=[double]$r.h
    $rect = [System.Windows.Rect]::new($cx-$w/2, $cy-$h/2, $w, $h)
    $dc.DrawRoundedRectangle($navyB, $null, $rect, 10, 10)
    CenterTxt $dc "DISCIBRA" $cx $cy ($h*0.40) ([System.Windows.Media.Colors]::White) $true
  }
}

$files = Get-ChildItem $Dir -File -Filter "imgi_*" |
         Where-Object { $_.Name -notmatch 'avatar' } |
         Sort-Object { [int]([regex]::Match($_.Name,'imgi_(\d+)').Groups[1].Value) }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$finals = @()
$n = 0
foreach ($f in $files) {
  $n++
  $src = Load-Bmp $f.FullName
  $W = $src.PixelWidth; $H = $src.PixelHeight
  $dv = [System.Windows.Media.DrawingVisual]::new()
  $dc = $dv.RenderOpen()
  $dc.DrawImage($src, [System.Windows.Rect]::new(0,0,$W,$H))
  foreach ($r in ($rules | Where-Object { $f.Name.StartsWith($_.m) })) { Draw-Mark $dc $r }
  $dc.Close()
  $rtb = [System.Windows.Media.Imaging.RenderTargetBitmap]::new($W, $H, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
  $rtb.Render($dv)
  $name = "banner-{0:d2}.jpg" -f $n
  $enc = [System.Windows.Media.Imaging.JpegBitmapEncoder]::new()
  $enc.QualityLevel = 92
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
  $fs = [System.IO.File]::Create((Join-Path $OutDir $name)); $enc.Save($fs); $fs.Close(); $fs.Dispose()
  $finals += [pscustomobject]@{ File=$name; Orig=$f.Name; Bmp=$rtb }
  Write-Host ("{0}  <-  {1}  {2} marcas" -f $name, $f.Name.Substring(0,22), ($rules | Where-Object { $f.Name.StartsWith($_.m) }).Count)
}

# ---- folha de verificacao (todos) ----
$TW=1000; $TH=224; $PAD=12; $LAB=30; $COLS=2
$rows=[math]::Ceiling($finals.Count/$COLS)
$SW=$COLS*($TW+$PAD)+$PAD; $SH=$rows*($TH+$LAB+$PAD)+$PAD
$dv=[System.Windows.Media.DrawingVisual]::new(); $dc=$dv.RenderOpen()
$dc.DrawRectangle([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(13,16,21)),$null,[System.Windows.Rect]::new(0,0,$SW,$SH))
$i=0
foreach ($it in $finals) {
  $col=$i%$COLS; $row=[math]::Floor($i/$COLS)
  $x=$PAD+$col*($TW+$PAD); $y=$PAD+$row*($TH+$LAB+$PAD)
  $dc.DrawImage($it.Bmp,[System.Windows.Rect]::new($x,$y,$TW,$TH))
  Txt $dc $it.File $x ($y+$TH+4) 16 ([System.Windows.Media.Color]::FromRgb(240,124,31)) $true
  $i++
}
$dc.Close()
$rtb2=[System.Windows.Media.Imaging.RenderTargetBitmap]::new($SW,$SH,96,96,[System.Windows.Media.PixelFormats]::Pbgra32); $rtb2.Render($dv)
$e2=[System.Windows.Media.Imaging.PngBitmapEncoder]::new(); $e2.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb2))
$f2=[System.IO.File]::Create($SheetOut); $e2.Save($f2); $f2.Close(); $f2.Dispose()

# ---- folha de zoom (recortes das areas cobertas) ----
$C=460; $Z=2.0; $ZW=[int]($C*$Z); $ZPAD=12; $ZLAB=28; $ZCOLS=2
$zrows=[math]::Ceiling($rules.Count/$ZCOLS)
$ZSW=$ZCOLS*($ZW+$ZPAD)+$ZPAD; $ZSH=$zrows*($ZW+$ZLAB+$ZPAD)+$ZPAD
$dv3=[System.Windows.Media.DrawingVisual]::new(); $dc3=$dv3.RenderOpen()
$dc3.DrawRectangle([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(13,16,21)),$null,[System.Windows.Rect]::new(0,0,$ZSW,$ZSH))
$j=0
foreach ($r in $rules) {
  $it = $finals | Where-Object { $_.Orig.StartsWith($r.m) } | Select-Object -First 1
  if (-not $it) { continue }
  $bmp = $it.Bmp
  $cx=[int]$r.cx; $cy=[int]$r.cy
  $x0=[Math]::Max(0,[Math]::Min($bmp.PixelWidth-$C, $cx-$C/2))
  $y0=[Math]::Max(0,[Math]::Min($bmp.PixelHeight-$C, $cy-$C/2))
  $cb=[System.Windows.Media.Imaging.CroppedBitmap]::new($bmp,[System.Windows.Int32Rect]::new($x0,$y0,$C,$C))
  $col=$j%$ZCOLS; $row=[math]::Floor($j/$ZCOLS)
  $zx=$ZPAD+$col*($ZW+$ZPAD); $zy=$ZPAD+$row*($ZW+$ZLAB+$ZPAD)
  $dc3.DrawImage($cb,[System.Windows.Rect]::new($zx,$zy,$ZW,$ZW))
  Txt $dc3 ($r.m + "  cx=" + $cx + " cy=" + $cy) $zx ($zy+$ZW+3) 14 ([System.Windows.Media.Color]::FromRgb(0,229,138)) $true
  $j++
}
$dc3.Close()
$rtb3=[System.Windows.Media.Imaging.RenderTargetBitmap]::new($ZSW,$ZSH,96,96,[System.Windows.Media.PixelFormats]::Pbgra32); $rtb3.Render($dv3)
$e3=[System.Windows.Media.Imaging.PngBitmapEncoder]::new(); $e3.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb3))
$f3=[System.IO.File]::Create($ZoomOut); $e3.Save($f3); $f3.Close(); $f3.Dispose()

Write-Host "FINAIS   -> $OutDir"
Write-Host "VERIFICA -> $SheetOut"
Write-Host "ZOOM     -> $ZoomOut"