param([string]$OrigDir,[string]$Out,[string]$RulesFile)

Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$R = (Import-PowerShellDataFile $RulesFile).Rules
$GREEN  = [System.Windows.Media.Color]::FromRgb(0,229,138)
$ORANGE = [System.Windows.Media.Color]::FromRgb(240,124,31)
$MAG    = [System.Windows.Media.Color]::FromRgb(255,0,200)

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

$files = Get-ChildItem $OrigDir -File -Filter "imgi_*" | Where-Object { $_.Name -notmatch 'avatar' } |
         Sort-Object { [int]([regex]::Match($_.Name,'imgi_(\d+)').Groups[1].Value) }

$S=0.62; $PAD=8; $LAB=20; $COLS=3
$b0=LB $files[0].FullName
$CW=[int]($b0.PixelWidth*$S); $CH=[int]($b0.PixelHeight*$S)
$rows=[math]::Ceiling($files.Count/$COLS)
$W=$COLS*($CW+$PAD)+$PAD; $H=$rows*($CH+$LAB+$PAD)+$PAD

$dv=[System.Windows.Media.DrawingVisual]::new(); $dc=$dv.RenderOpen()
$dc.DrawRectangle([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(13,16,21)),$null,[System.Windows.Rect]::new(0,0,$W,$H))
$pen5 =[System.Windows.Media.Pen]::new([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(60,0,229,138)),1)
$pen10=[System.Windows.Media.Pen]::new([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(200,0,229,138)),1)
$mag  =[System.Windows.Media.Pen]::new([System.Windows.Media.SolidColorBrush]::new($MAG),2)

$i=0
foreach($f in $files){
  $bmp=LB $f.FullName
  $col=$i%$COLS; $row=[math]::Floor($i/$COLS)
  $x=$PAD+$col*($CW+$PAD); $y=$PAD+$row*($CH+$LAB+$PAD)
  $dc.DrawImage($bmp,[System.Windows.Rect]::new($x,$y,$CW,$CH))
  for($k=1;$k -lt 20;$k++){
    $gx=$x+$CW*$k/20; $gy=$y+$CH*$k/20
    $pen=if($k%2 -eq 0){$pen10}else{$pen5}
    $dc.DrawLine($pen,[System.Windows.Point]::new($gx,$y),[System.Windows.Point]::new($gx,$y+$CH))
    $dc.DrawLine($pen,[System.Windows.Point]::new($x,$gy),[System.Windows.Point]::new($x+$CW,$gy))
    if($k%2 -eq 0){
      CT $dc ([string]($k*5)) ($gx+11) ($y+7) 9 $GREEN $true
      CT $dc ([string]($k*5)) ($x+11) ($gy-6) 9 $GREEN $true
    }
  }
  foreach($r in ($R | Where-Object { $_.m -eq $f.Name.Substring(0,15) -or $f.Name.StartsWith($_.m) })){
    $mx=$x+[double]$r.cx*$S; $my=$y+[double]$r.cy*$S
    $dc.DrawLine($mag,[System.Windows.Point]::new($mx-12,$my),[System.Windows.Point]::new($mx+12,$my))
    $dc.DrawLine($mag,[System.Windows.Point]::new($mx,$my-12),[System.Windows.Point]::new($mx,$my+12))
  }
  CT $dc $f.Name.Substring(0,15) ($x+$CW/2) ($y+$CH+10) 12 $ORANGE $true
  $i++
}
$dc.Close()
$rtb=[System.Windows.Media.Imaging.RenderTargetBitmap]::new($W,$H,96,96,[System.Windows.Media.PixelFormats]::Pbgra32); $rtb.Render($dv)
$e=[System.Windows.Media.Imaging.PngBitmapEncoder]::new(); $e.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
$fl=[System.IO.File]::Create($Out); $e.Save($fl); $fl.Close(); $fl.Dispose()
Write-Host "FULL -> $Out ($W x $H)"