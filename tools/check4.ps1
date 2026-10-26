param([string]$OrigDir,[string]$FinalsDir,[string]$Out)
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase
function LB([string]$p){
  $b=[System.IO.File]::ReadAllBytes($p); $ms=[System.IO.MemoryStream]::new($b)
  $d=[System.Windows.Media.Imaging.BitmapDecoder]::Create($ms,[System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
  [System.Windows.Media.Imaging.FormatConvertedBitmap]::new($d.Frames[0],[System.Windows.Media.PixelFormats]::Bgra32,$null,0)
}
function CT($dc,[string]$t,[double]$x,[double]$y,[double]$s,$c,[bool]$b){
  $fw=if($b){[System.Windows.FontWeights]::Bold}else{[System.Windows.FontWeights]::Normal}
  $tf=[System.Windows.Media.Typeface]::new("Arial",[System.Windows.FontStyles]::Normal,$fw,[System.Windows.FontStretches]::Normal)
  $ft=[System.Windows.Media.FormattedText]::new($t,[System.Globalization.CultureInfo]::InvariantCulture,[System.Windows.FlowDirection]::LeftToRight,$tf,$s,[System.Windows.Media.SolidColorBrush]::new($c),1.0)
  $dc.DrawText($ft,[System.Windows.Point]::new($x,$y))
}
$orig = Get-ChildItem $OrigDir -File -Filter "imgi_*" | Where-Object { $_.Name -notmatch 'avatar' } |
        Sort-Object { [int]([regex]::Match($_.Name,'imgi_(\d+)').Groups[1].Value) }
$map=@{}; $n=0
foreach($o in $orig){ $n++; $map[$o.Name]=("banner-{0:d2}.jpg" -f $n) }
$alvos=@('imgi_3_fd969baa','imgi_5_d801a316','imgi_6_9c6eff6c','imgi_9_9d6a2d37')
$PAD=10; $LAB=30
$W=1940; $H=$alvos.Count*(430+$LAB+$PAD)+$PAD
$dv=[System.Windows.Media.DrawingVisual]::new(); $dc=$dv.RenderOpen()
$dc.DrawRectangle([System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(13,16,21)),$null,[System.Windows.Rect]::new(0,0,$W,$H))
$i=0
foreach($a in $alvos){
  $fn=$map[($orig | Where-Object { $_.Name.StartsWith($a) } | Select-Object -First 1).Name]
  $bmp=LB (Join-Path $FinalsDir $fn)
  $y=$PAD+$i*(430+$LAB+$PAD)
  $dc.DrawImage($bmp,[System.Windows.Rect]::new($PAD,$y,1920,430))
  CT $dc ("{0}  <-  {1}" -f $fn,$a) $PAD ($y+434) 16 ([System.Windows.Media.Color]::FromRgb(240,124,31)) $true
  $i++
}
$dc.Close()
$rtb=[System.Windows.Media.Imaging.RenderTargetBitmap]::new($W,$H,96,96,[System.Windows.Media.PixelFormats]::Pbgra32); $rtb.Render($dv)
$e=[System.Windows.Media.Imaging.PngBitmapEncoder]::new(); $e.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
$f=[System.IO.File]::Create($Out); $e.Save($f); $f.Close(); $f.Dispose()
Write-Host "CHECK -> $Out"