param([string]$Dir,[string]$OutDir,[string]$Sheet,[string]$RulesFile)

Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$R = (Import-PowerShellDataFile $RulesFile).Rules
$NAVY   = [System.Windows.Media.Color]::FromRgb(15,42,95)
$ORANGE = [System.Windows.Media.Color]::FromRgb(240,124,31)

function LB([string]$p){
  $b=[System.IO.File]::ReadAllBytes($p)
  $ms=[System.IO.MemoryStream]::new($b)
  $d=[System.Windows.Media.Imaging.BitmapDecoder]::Create($ms,[System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
  [System.Windows.Media.Imaging.FormatConvertedBitmap]::new($d.Frames[0],[System.Windows.Media.PixelFormats]::Bgra32,$null,0)
}
function CT($dc,[string]$t,[double]$cx,[double]$cy,[double]$size,$col,[bool]$b){
  $fw=if($b){[System.Windows.FontWeights]::Bold}else{[System.Windows.FontWeights]::Normal}
  $tf=[System.Windows.Media.Typeface]::new("Arial",[System.Windows.FontStyles]::Normal,$fw,[System.Windows.FontStretches]::Normal)
  $ft=[System.Windows.Media.FormattedText]::new($t,[System.Globalization.CultureInfo]::InvariantCulture,[System.Windows.FlowDirection]::LeftToRight,$tf,$size,[System.Windows.Media.SolidColorBrush]::new($col),1.0)
  $dc.DrawText($ft,[System.Windows.Point]::new($cx-$ft.Width/2,$cy-$ft.Height/2))
}
function Mark($dc,$r){
  $nb=[System.Windows.Media.SolidColorBrush]::new($NAVY)
  $ob=[System.Windows.Media.SolidColorBrush]::new($ORANGE)
  if($r.shape -eq 'rect'){
    $cx=[double]$r.cx;$cy=[double]$r.cy;$w=[double]$r.w;$h=[double]$r.h
    $pen=[System.Windows.Media.Pen]::new($ob,3)
    $dc.DrawRectangle($nb,$pen,[System.Windows.Rect]::new($cx-$w/2,$cy-$h/2,$w,$h))
    CT $dc "DISCIBRA" $cx ($cy-4) ($h*0.42) ([System.Windows.Media.Colors]::White) $true
    CT $dc "DISTRIBUIDORA" $cx ($cy+$h*0.30) ($h*0.17) ([System.Windows.Media.Color]::FromRgb(240,124,31)) $true
  } else {
    $cx=[double]$r.cx;$cy=[double]$r.cy;$rad=[double]$r.r
    $dc.DrawEllipse($nb,$null,[System.Windows.Point]::new($cx,$cy),$rad,$rad)
    $p=[System.Windows.Media.Pen]::new($ob,[Math]::Max(3,$rad*0.16))
    $p.StartLineCap=[System.Windows.Media.PenLineCap]::Round; $p.EndLineCap=[System.Windows.Media.PenLineCap]::Round
    $dc.DrawLine($p,[System.Windows.Point]::new($cx-$rad*0.52,$cy-$rad*0.02),[System.Windows.Point]::new($cx,$cy-$rad*0.40))
    $dc.DrawLine($p,[System.Windows.Point]::new($cx,$cy-$rad*0.40),[System.Windows.Point]::new($cx+$rad*0.52,$cy-$rad*0.02))
    CT $dc "D" $cx ($cy+$rad*0.26) ($rad*0.95) ([System.Windows.Media.Colors]::White) $true
  }
}

$files = Get-ChildItem $Dir -File -Filter "imgi_*" | Where-Object { $_.Name -notmatch 'avatar' } |
         Sort-Object { [int]([regex]::Match($_.Name,'imgi_(\d+)').Groups[1].Value) }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$finals=@(); $n=0
foreach($f in $files){
  $n++
  $src=LB $f.FullName
  $W=$src.PixelWidth; $H=$src.PixelHeight
  $dv=[System.Windows.Media.DrawingVisual]::new(); $dc=$dv.RenderOpen()
  $dc.DrawImage($src,[System.Windows.Rect]::new(0,0,$W,$H))
  $cnt=0
  foreach($r in ($R | Where-Object { $f.Name.StartsWith($_.m) })){ Mark $dc $r; $cnt++ }
  $dc.Close()
  $rtb=[System.Windows.Media.Imaging.RenderTargetBitmap]::new($W,$H,96,96,[System.Windows.Media.PixelFormats]::Pbgra32); $rtb.Render($dv)
  $name="banner-{0:d2}.jpg" -f $n
  $enc=[System.Windows.Media.Imaging.JpegBitmapEncoder]::new(); $enc.QualityLevel=92
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
  $fs=[System.IO.File]::Create((Join-Path $OutDir $name)); $enc.Save($fs); $fs.Close(); $fs.Dispose()
  $finals+=[pscustomobject]@{File=$name;Orig=$f.Name;Bmp=$rtb}
  Write-Host ("{0} <- {1} ({2} marcas)" -f $name,$f.Name.Substring(0,20),$cnt)
}
$TW=1000;$TH=224;$PAD=12;$LAB=30;$COLS=2
$rows=[math]::Ceiling($finals.Count/$COLS)
$SW=$COLS*($TW+$PAD)+$PAD;$SH=$rows*($TH+$LAB+$PAD)+$PAD
$dv=[System.Windows.Media.DrawingVisual]::new();$dc=$dv.RenderOpen()
$dc.DrawRectangle([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(13,16,21)),$null,[System.Windows.Rect]::new(0,0,$SW,$SH))
$i=0
foreach($it in $finals){
  $col=$i%$COLS;$row=[math]::Floor($i/$COLS)
  $x=$PAD+$col*($TW+$PAD);$y=$PAD+$row*($TH+$LAB+$PAD)
  $dc.DrawImage($it.Bmp,[System.Windows.Rect]::new($x,$y,$TW,$TH))
  CT $dc $it.File ($x+$TW/2) ($y+$TH+15) 15 ([System.Windows.Media.Color]::FromRgb(240,124,31)) $true
  $i++
}
$dc.Close()
$r2=[System.Windows.Media.Imaging.RenderTargetBitmap]::new($SW,$SH,96,96,[System.Windows.Media.PixelFormats]::Pbgra32);$r2.Render($dv)
$e=[System.Windows.Media.Imaging.PngBitmapEncoder]::new();$e.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($r2))
$f2=[System.IO.File]::Create($Sheet);$e.Save($f2);$f2.Close();$f2.Dispose()
Write-Host "OK -> $OutDir | $Sheet"