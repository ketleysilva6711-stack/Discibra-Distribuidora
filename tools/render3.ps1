param([string]$Dir,[string]$OutDir,[string]$Check)

Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$rules = @(
  @{ m='imgi_2_a9cfa2a4'; k='c'; cx=880;  cy=47;  r=30 }
  @{ m='imgi_3_fd969baa'; k='c'; cx=180;  cy=50;  r=30 }
  @{ m='imgi_3_f360afc9'; k='c'; cx=1385; cy=32;  r=28 }
  @{ m='imgi_4_9d2faad5'; k='c'; cx=180;  cy=50;  r=30 }
  @{ m='imgi_4_acc42a88'; k='c'; cx=190;  cy=45;  r=28 }
  @{ m='imgi_5_2e773153'; k='c'; cx=1590; cy=42;  r=28 }
  @{ m='imgi_5_d801a316'; k='c'; cx=180;  cy=50;  r=30 }
  @{ m='imgi_5_d801a316'; k='c'; cx=957;  cy=60;  r=34 }
  @{ m='imgi_6_9c6eff6c'; k='c'; cx=180;  cy=50;  r=30 }
  @{ m='imgi_6_9c6eff6c'; k='c'; cx=1667; cy=70;  r=34 }
  @{ m='imgi_6_5c3bf83b'; k='c'; cx=1574; cy=45;  r=28 }
  @{ m='imgi_7_916be3fe'; k='c'; cx=300;  cy=50;  r=30 }
  @{ m='imgi_8_391f0e79'; k='c'; cx=1615; cy=60;  r=28 }
  @{ m='imgi_8_dd8985cc'; k='c'; cx=100;  cy=200; r=28 }
  @{ m='imgi_9_9d6a2d37'; k='r'; cx=342;  cy=95;  w=310; h=100 }
  @{ m='imgi_9_db85aae2'; k='c'; cx=1574; cy=45;  r=28 }
  @{ m='imgi_10_fba4ad97';k='c'; cx=1435; cy=150; r=28 }
)

$NAVY=[System.Windows.Media.Color]::FromRgb(15,42,95)
$ORNG=[System.Windows.Media.Color]::FromRgb(240,124,31)
$nb=[System.Windows.Media.SolidColorBrush]::new($NAVY)
$ob=[System.Windows.Media.SolidColorBrush]::new($ORNG)

function LB([string]$p){
  $b=[System.IO.File]::ReadAllBytes($p); $ms=[System.IO.MemoryStream]::new($b)
  $d=[System.Windows.Media.Imaging.BitmapDecoder]::Create($ms,[System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
  [System.Windows.Media.Imaging.FormatConvertedBitmap]::new($d.Frames[0],[System.Windows.Media.PixelFormats]::Bgra32,$null,0)
}
function TXT($dc,[string]$t,[double]$cx,[double]$cy,[double]$size,$col,[bool]$b){
  $fw=if($b){[System.Windows.FontWeights]::Bold}else{[System.Windows.FontWeights]::Normal}
  $tf=[System.Windows.Media.Typeface]::new("Arial",[System.Windows.FontStyles]::Normal,$fw,[System.Windows.FontStretches]::Normal)
  $ft=[System.Windows.Media.FormattedText]::new($t,[System.Globalization.CultureInfo]::InvariantCulture,[System.Windows.FlowDirection]::LeftToRight,$tf,$size,[System.Windows.Media.SolidColorBrush]::new($col),1.0)
  $dc.DrawText($ft,[System.Windows.Point]::new($cx-$ft.Width/2,$cy-$ft.Height/2))
}

$files = Get-ChildItem $Dir -File -Filter "imgi_*" | Where-Object { $_.Name -notmatch 'avatar' } |
         Sort-Object { [int]([regex]::Match($_.Name,'imgi_(\d+)').Groups[1].Value) }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$map=@{}; $n=0
foreach($f in $files){
  $n++
  $src=LB $f.FullName
  $W=$src.PixelWidth; $H=$src.PixelHeight
  $dv=[System.Windows.Media.DrawingVisual]::new(); $dc=$dv.RenderOpen()
  $dc.DrawImage($src,[System.Windows.Rect]::new(0,0,$W,$H))

  foreach($r in $rules){
    if(-not $f.Name.StartsWith($r['m'])){ continue }
    if($r['k'] -eq 'r'){
      $cx=[double]$r['cx']; $cy=[double]$r['cy']; $w=[double]$r['w']; $h=[double]$r['h']
      $rect=[System.Windows.Rect]::new($cx-$w/2, $cy-$h/2, $w, $h)
      $dc.DrawRectangle($nb,[System.Windows.Media.Pen]::new($ob,3),$rect)
      TXT $dc "DISCIBRA" $cx ($cy-6) ($h*0.40) ([System.Windows.Media.Colors]::White) $true
      TXT $dc "DISTRIBUIDORA" $cx ($cy+$h*0.28) ($h*0.16) $ORNG $true
      Write-Host ("  RETANGULO {0} em {1},{2}" -f $f.Name.Substring(0,14),$cx,$cy)
    } else {
      $cx=[double]$r['cx']; $cy=[double]$r['cy']; $rad=[double]$r['r']
      $dc.DrawEllipse($nb,$null,[System.Windows.Point]::new($cx,$cy),$rad,$rad)
      $p=[System.Windows.Media.Pen]::new($ob,[Math]::Max(3,$rad*0.16))
      $p.StartLineCap=[System.Windows.Media.PenLineCap]::Round; $p.EndLineCap=[System.Windows.Media.PenLineCap]::Round
      $dc.DrawLine($p,[System.Windows.Point]::new($cx-$rad*0.52,$cy-$rad*0.02),[System.Windows.Point]::new($cx,$cy-$rad*0.40))
      $dc.DrawLine($p,[System.Windows.Point]::new($cx,$cy-$rad*0.40),[System.Windows.Point]::new($cx+$rad*0.52,$cy-$rad*0.02))
      TXT $dc "D" $cx ($cy+$rad*0.26) ($rad*0.95) ([System.Windows.Media.Colors]::White) $true
      Write-Host ("  CIRCULO {0} em {1},{2}" -f $f.Name.Substring(0,14),$cx,$cy)
    }
  }
  $dc.Close()
  $rtb=[System.Windows.Media.Imaging.RenderTargetBitmap]::new($W,$H,96,96,[System.Windows.Media.PixelFormats]::Pbgra32); $rtb.Render($dv)
  $name="banner-{0:d2}.jpg" -f $n
  $map[$f.Name]=$name
  $enc=[System.Windows.Media.Imaging.JpegBitmapEncoder]::new(); $enc.QualityLevel=92
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
  $fs=[System.IO.File]::Create((Join-Path $OutDir $name)); $enc.Save($fs); $fs.Close(); $fs.Dispose()
  Write-Host ("{0} <- {1}" -f $name,$f.Name.Substring(0,20))
}

$alvos=@('imgi_3_fd969baa','imgi_5_d801a316','imgi_6_9c6eff6c','imgi_9_9d6a2d37')
$PAD=10; $LAB=30
$CW=1940; $CH=$alvos.Count*(430+$LAB+$PAD)+$PAD
$dv2=[System.Windows.Media.DrawingVisual]::new(); $dc2=$dv2.RenderOpen()
$dc2.DrawRectangle([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(13,16,21)),$null,[System.Windows.Rect]::new(0,0,$CW,$CH))
$i=0
foreach($a in $alvos){
  $orig=$files | Where-Object { $_.Name.StartsWith($a) } | Select-Object -First 1
  $bmp=LB (Join-Path $OutDir $map[$orig.Name])
  $y=$PAD+$i*(430+$LAB+$PAD)
  $dc2.DrawImage($bmp,[System.Windows.Rect]::new($PAD,$y,1920,430))
  TXT $dc2 ("{0}  <-  {1}" -f $map[$orig.Name],$a) 300 ($y+434) 16 $ORNG $true
  $i++
}
$dc2.Close()
$rtb2=[System.Windows.Media.Imaging.RenderTargetBitmap]::new($CW,$CH,96,96,[System.Windows.Media.PixelFormats]::Pbgra32); $rtb2.Render($dv2)
$e2=[System.Windows.Media.Imaging.PngBitmapEncoder]::new(); $e2.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb2))
$f2=[System.IO.File]::Create($Check); $e2.Save($f2); $f2.Close(); $f2.Dispose()
Write-Host "CHECK -> $Check"