param([string]$OrigDir,[string]$FinalsDir,[string]$Out,[string]$RulesFile)

Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase
$R = (Import-PowerShellDataFile $RulesFile).Rules

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

$orig = Get-ChildItem $OrigDir -File -Filter "imgi_*" | Where-Object { $_.Name -notmatch 'avatar' } |
        Sort-Object { [int]([regex]::Match($_.Name,'imgi_(\d+)').Groups[1].Value) }
$map=@{}; $n=0
foreach($o in $orig){ $n++; $map[$o.Name] = ("banner-{0:d2}.jpg" -f $n) }

$C=380; $Z=1.4; $ZW=[int]($C*$Z); $PAD=8; $LAB=20; $COLS=4
$rows=[math]::Ceiling($R.Count/$COLS)
$W=$COLS*($ZW+$PAD)+$PAD; $H=$rows*($ZW+$LAB+$PAD)+$PAD

$dv=[System.Windows.Media.DrawingVisual]::new(); $dc=$dv.RenderOpen()
$dc.DrawRectangle([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(13,16,21)),$null,[System.Windows.Rect]::new(0,0,$W,$H))
$j=0
foreach($r in $R){
  $fn=$null
  foreach($k in $map.Keys){ if($k.StartsWith($r.m)){ $fn=$map[$k]; break } }
  if(-not $fn){ continue }
  $bmp = LB (Join-Path $FinalsDir $fn)
  $cx=[int]$r.cx; $cy=[int]$r.cy
  $x0=[Math]::Max(0,[Math]::Min($bmp.PixelWidth-$C,$cx-[int]($C/2)))
  $y0=[Math]::Max(0,[Math]::Min($bmp.PixelHeight-$C,$cy-[int]($C/2)))
  $cb=[System.Windows.Media.Imaging.CroppedBitmap]::new($bmp,[System.Windows.Int32Rect]::new($x0,$y0,$C,$C))
  $col=$j%$COLS; $row=[math]::Floor($j/$COLS)
  $zx=$PAD+$col*($ZW+$PAD); $zy=$PAD+$row*($ZW+$LAB+$PAD)
  $dc.DrawImage($cb,[System.Windows.Rect]::new($zx,$zy,$ZW,$ZW))
  CT $dc ("{0} {1} {2},{3}" -f $fn,$r.shape,$cx,$cy) ($zx+$ZW/2) ($zy+$ZW+10) 11 ([System.Windows.Media.Color]::FromRgb(0,229,138)) $true
  $j++
}
$dc.Close()
$rtb=[System.Windows.Media.Imaging.RenderTargetBitmap]::new($W,$H,96,96,[System.Windows.Media.PixelFormats]::Pbgra32); $rtb.Render($dv)
$e=[System.Windows.Media.Imaging.PngBitmapEncoder]::new(); $e.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
$f=[System.IO.File]::Create($Out); $e.Save($f); $f.Close(); $f.Dispose()
Write-Host "ZOOM -> $Out ($W x $H)"