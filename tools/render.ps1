param([string]$Dir,[string]$OutDir,[string]$Sheet,[string]$Zoom,[string]$RulesFile)

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
  $br=[System.Windows.Media.SolidColorBrush]::new($col)
  $ft=[System.Windows.Media.FormattedText]::new($t,[System.Globalization.CultureInfo]::InvariantCulture,[System.Windows.FlowDirection]::LeftToRight,$tf,$size,$br,1.0)
  $dc.DrawText($ft,[System.Windows.Point]::new($cx-$ft.Width/2,$cy-$ft.Height/2))
}

function Mark($dc,$r){
  $nb=[System.Windows.Media.SolidColorBrush]::new($NAVY)
  $ob=[System.Windows.Media.SolidColorBrush]::new($ORANGE)
  if($r.shape -eq 'circle'){
    $cx=[double]$r.cx;$cy=[double]$r.cy;$rad=[double]$r.r
    $dc.DrawEllipse($nb,$null,[System.Windows.Point]::new($cx,$cy),$rad,$rad)
    $p=[System.Windows.Media.Pen]::new($ob,[Math]::Max(3,$rad*0.16))
    $p.StartLineCap=[System.Windows.Media.PenLineCap]::Round; $p.EndLineCap=[System.Windows.Media.PenLineCap]::Round
    $dc.DrawLine($p,[System.Windows.Point]::new($cx-$rad*0.52,$cy-$rad*0.02),[System.Windows.Point]::new($cx,$cy-$rad*0.40))
    $dc.DrawLine($p,[System.Windows.Point]::new($cx,$cy-$rad*0.40),[System.Windows.Point]::new($cx+$rad*0.52,$cy-$rad*0.02))
    CT $dc "D" $cx ($cy+$rad*0.26) ($rad*0.95) ([System.Windows.Media.Colors]::White) $true
  } elseif($r.shape -eq 'rect'){
    $cx=[double]$r.cx;$cy=[double]$r.cy;$w=[double]$r.w;$h=[double]$r.h
    $dc.DrawRoundedRectangle($nb,$null,[System.Windows.Rect]::new($cx-$w/2,$cy-$h/2,$w,$h),10,10)
    CT $dc "DISCIBRA" $cx $cy ($h*0.40) ([System.Windows.Media.Colors]::White) $true
  } else {
    $cx=[double]$r.cx;$cy=[double]$r.cy;$w=[double]$r.w;$h=[double]$r.h
    $dc.DrawRoundedRectangle($nb,$null,[System.Windows.Rect]::new($cx-$w/2,$cy-$h/2,$w,$h),8,8)
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

# folha geral
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
  CT $dc $it.File ($x+60) ($y+$TH+15) 16 ([System.Windows.Media.Color]::FromRgb(240,124,31)) $true
  $i++
}
$dc.Close()
$r2=[System.Windows.Media.Imaging.RenderTargetBitmap]::new($SW,$SH,96,96,[System.Windows.Media.PixelFormats]::Pbgra32);$r2.Render($dv)
$e=[System.Windows.Media.Imaging.PngBitmapEncoder]::new();$e.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($r2))
$f2=[System.IO.File]::Create($Sheet);$e.Save($f2);$f2.Close();$f2.Dispose()

# folha zoom
$C=420;$Z=2.2;$ZW=[int]($C*$Z);$ZP=12;$ZL=26;$ZC=2
$zr=[math]::Ceiling($R.Count/$ZC)
$ZSW=$ZC*($ZW+$ZP)+$ZP;$ZSH=$zr*($ZW+$ZL+$ZP)+$ZP
$dv3=[System.Windows.Media.DrawingVisual]::new();$dc3=$dv3.RenderOpen()
$dc3.DrawRectangle([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(13,16,21)),$null,[System.Windows.Rect]::new(0,0,$ZSW,$ZSH))
$j=0
foreach($r in $R){
  $it=$finals|Where-Object{$_.Orig.StartsWith($r.m)}|Select-Object -First 1
  if(-not $it){continue}
  $bmp=$it.Bmp
  $x0=[Math]::Max(0,[Math]::Min($bmp.PixelWidth-$C,[int]$r.cx-$C/2))
  $y0=[Math]::Max(0,[Math]::Min($bmp.PixelHeight-$C,[int]$r.cy-$C/2))
  $cb=[System.Windows.Media.Imaging.CroppedBitmap]::new($bmp,[System.Windows.Int32Rect]::new($x0,$y0,$C,$C))
  $col=$j%$ZC;$row=[math]::Floor($j/$ZC)
  $zx=$ZP+$col*($ZW+$ZP);$zy=$ZP+$row*($ZW+$ZL+$ZP)
  $dc3.DrawImage($cb,[System.Windows.Rect]::new($zx,$zy,$ZW,$ZW))
  CT $dc3 ("{0} {1} cx={2} cy={3}" -f $r.m.Substring(0,14),$r.shape,$r.cx,$r.cy) ($zx+$ZW/2) ($zy+$ZW+13) 13 ([System.Windows.Media.Color]::FromRgb(0,229,138)) $true
  $j++
}
$dc3.Close()
$r3=[System.Windows.Media.Imaging.RenderTargetBitmap]::new($ZSW,$ZSH,96,96,[System.Windows.Media.PixelFormats]::Pbgra32);$r3.Render($dv3)
$e3=[System.Windows.Media.Imaging.PngBitmapEncoder]::new();$e3.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($r3))
$f3=[System.IO.File]::Create($Zoom);$e3.Save($f3);$f3.Close();$f3.Dispose()

Write-Host "OK -> $OutDir | $Sheet | $Zoom"