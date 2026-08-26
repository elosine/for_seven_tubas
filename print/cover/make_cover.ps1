Add-Type -AssemblyName System.Drawing

# THE HOUSE STYLE, measured off scores/Litany.pdf page 1 (day 36):
#   title : name = 2 : 1  ·  title baseline 27.1% down  ·  name 53.9% down
#   both centred  ·  ZERO added tracking  ·  black
# Subtitle added day 36 at the composer's ask: under the title, above the name,
# "a little smaller than title" -> 0.65 x title.
$FONT = "EngraversGothic BT"
$DPI = 300
$MARGIN_IN = 0.75
$OUT = "C:\Users\jwloy\AppData\Local\Temp\claude\C--Users-jwloy-GitHub-for-seven-tubas\5673df1c-2cfe-4c08-b21a-1d52c7112645\scratchpad\covers"
Remove-Item "$OUT\*" -Force -ErrorAction SilentlyContinue
if (-not (Test-Path $OUT)) { New-Item -ItemType Directory -Force $OUT | Out-Null }

$script:fam = New-Object System.Drawing.FontFamily($FONT)
$script:sf = [System.Drawing.StringFormat]::GenericTypographic
$script:asc = $script:fam.GetCellAscent([System.Drawing.FontStyle]::Regular) / $script:fam.GetEmHeight([System.Drawing.FontStyle]::Regular)

function Get-W {
  param([System.Drawing.Graphics]$G, [string]$Txt, [double]$Pt, [int]$Dpi)
  $f = New-Object System.Drawing.Font($script:fam, ($Pt * $Dpi / 72.0), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $w = $G.MeasureString($Txt, $f, 100000, $script:sf).Width
  $f.Dispose()
  return [double]$w
}

function Put-Line {
  param([System.Drawing.Graphics]$G, [string]$Txt, [double]$Pt, [double]$BaselinePt, [int]$WPx, [int]$Dpi)
  $px = $Pt * $Dpi / 72.0
  $f = New-Object System.Drawing.Font($script:fam, $px, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $w = $G.MeasureString($Txt, $f, 100000, $script:sf).Width
  $x = ($WPx - $w) / 2.0
  $y = ($BaselinePt * $Dpi / 72.0) - ($script:asc * $px)
  $G.DrawString($Txt, $f, [System.Drawing.Brushes]::Black, $x, $y, $script:sf)
  $f.Dispose()
}

function New-Cover {
  param([string]$Tag, [double]$WIn, [double]$HIn, [string[]]$TitleLines,
        [string]$Subtitle, [string]$Name, [double]$BasePt, [double]$FirstFrac)

  $wpx = [int]($WIn * $DPI); $hpx = [int]($HIn * $DPI)
  $bmp = New-Object System.Drawing.Bitmap($wpx, $hpx)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  # shrink until the WIDEST title line fits inside the margins
  $titlePt = $BasePt
  $maxW = ($WIn - 2 * $MARGIN_IN) * $DPI
  while ($titlePt -gt 8) {
    $widest = 0.0
    foreach ($ln in $TitleLines) { $w = Get-W $g $ln $titlePt $DPI; if ($w -gt $widest) { $widest = $w } }
    if ($widest -le $maxW) { break }
    $titlePt = $titlePt - 0.5
  }
  $subPt = $titlePt * 0.65
  $namePt = $titlePt * 0.5

  $wpt = $WIn * 72.0; $hpt = $HIn * 72.0
  $y = $hpt * $FirstFrac
  $svg = ""
  foreach ($ln in $TitleLines) {
    Put-Line $g $ln $titlePt $y $wpx $DPI
    $svg += "`n    <text x=""$([math]::Round($wpt/2,2))"" y=""$([math]::Round($y,2))"" font-size=""$([math]::Round($titlePt,2))"">$ln</text>"
    $y = $y + $titlePt * 1.15
  }
  $y = $y + $titlePt * 0.10
  Put-Line $g $Subtitle $subPt $y $wpx $DPI
  $svg += "`n    <text x=""$([math]::Round($wpt/2,2))"" y=""$([math]::Round($y,2))"" font-size=""$([math]::Round($subPt,2))"">$Subtitle</text>"
  $y = $y + $titlePt * 1.60
  Put-Line $g $Name $namePt $y $wpx $DPI
  $svg += "`n    <text x=""$([math]::Round($wpt/2,2))"" y=""$([math]::Round($y,2))"" font-size=""$([math]::Round($namePt,2))"">$Name</text>"

  $bmp.Save((Join-Path $OUT "cover-$Tag.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()

  $doc = "<svg xmlns=""http://www.w3.org/2000/svg"" width=""${wpt}pt"" height=""${hpt}pt"" viewBox=""0 0 $wpt $hpt"">`n" +
         "  <rect width=""100%"" height=""100%"" fill=""#ffffff""/>`n" +
         "  <g font-family=""$FONT"" fill=""#000000"" text-anchor=""middle"">$svg`n  </g>`n</svg>`n"
  [System.IO.File]::WriteAllText((Join-Path $OUT "cover-$Tag.svg"), $doc, (New-Object System.Text.UTF8Encoding $false))

  "{0,-27} {1,4} x {2,-4} in   title {3,5:N1}   sub {4,5:N1}   name {5,5:N1} pt   last baseline {6,5:N0} pt ({7:P0} down)" -f `
    $Tag, $WIn, $HIn, $titlePt, $subPt, $namePt, $y, ($y / $hpt)
}

$D = [string][char]0x2014
$ONE = @("Bloom $D Convergence $D Balance")
$THREE = @("Bloom", "Convergence", "Balance")
$SUB = "for Tuba Ensemble"
$NAME = "Justin Yang"

New-Cover "A-letter-portrait-1line"   8.5 11.0 $ONE   $SUB $NAME 72 0.271
New-Cover "B-letter-portrait-stacked" 8.5 11.0 $THREE $SUB $NAME 72 0.200
New-Cover "C-letter-landscape-1line"  11.0 8.5 $ONE   $SUB $NAME 72 0.271
New-Cover "D-tabloid-landscape-1line" 17.0 11.0 $ONE  $SUB $NAME 93 0.271
""
"wrote to $OUT"
