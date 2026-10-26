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

$C=320; $Z=1.7; $ZW=[int]($C*$Z); $ZP=10; $ZL=24; $ZC=4
$zr=[math]::Ceiling($R.Count/$ZC)
$W=$ZC*($ZW+$ZP)+$ZP; $H=$zr*($ZW+$ZL+$ZP)+$ZP

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
  $col=$j%$ZC; $row=[math]::Floor($j/$ZC)
  $zx=$ZP+$col*($ZW+$ZP); $zy=$ZP+$row*($ZW+$ZL+$ZP)
  $dc.DrawImage($cb,[System.Windows.Rect]::new($zx,$zy,$ZW,$ZW))
  CT $dc ("{0} {1} {2},{3}" -f $fn,$r.shape,$cx,$cy) ($zx+$ZW/2) ($zy+$ZW+11) 12 ([System.Windows.Media.Color]::FromRgb(0,229,138)) $true
  Write-Host ("{0}  {1}  {2}  cx={3} cy={4}" -f $fn,$r.m,$r.shape,$cx,$cy)
  $j++
}
$dc.Close()
$rtb=[System.Windows.Media.Imaging.RenderTargetBitmap]::new($W,$H,96,96,[System.Windows.Media.PixelFormats]::Pbgra32); $rtb.Render($dv)
$e=[System.Windows.Media.Imaging.PngBitmapEncoder]::new(); $e.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
$f=[System.IO.File]::Create($Out); $e.Save($f); $f.Close(); $f.Dispose()
Write-Host "ZOOM -> $Out  ($W x $H)"