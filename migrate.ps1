$ErrorActionPreference = "Continue"
$oldUrl = "https://sdafczehznywoeqnfgph.supabase.co"
$oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYWZjemVoem55d29lcW5mZ3BoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExMjk0OCwiZXhwIjoyMDg3Njg4OTQ4fQ.jDUDj3hH5KGlzWISUMi5MIp_u5QiQ3aV0JBwV7PT3S8"
$newUrl = "https://mvgwgzzaiamxddydrclt.supabase.co"
$newKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Z3dnenphaWFteGRkeWRyY2x0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjk0Mjk2NiwiZXhwIjoyMTA4NTE4OTY2fQ.CcOEhk1aMjw8qWGxXd_chwnQjgrV93p3hLvxkFo9I9c"

$oh = @{ "apikey" = $oldKey; "Authorization" = "Bearer $oldKey" }
$nh = @{ "apikey" = $newKey; "Authorization" = "Bearer $newKey"; "Prefer" = "resolution=merge-duplicates" }

$tabelas = @("categories","subcategories","products","banners","site_settings","testimonials","reviews","whatsapp_numbers","whatsapp_clicks","admin_users","admins","customers","profiles","orders","order_items","users")
$page = 500
$log = "migracao-log.txt"
"=== INICIO $(Get-Date) ===" | Out-File $log -Encoding UTF8

foreach ($t in $tabelas) {
  Write-Host ">>> Migrando $t" -ForegroundColor Cyan
  $off = 0; $lidos = 0; $enviados = 0
  while ($true) {
    try { $rows = Invoke-RestMethod -Uri "$oldUrl/rest/v1/$t`?select=*&limit=$page&offset=$off" -Headers $oh -ErrorAction Stop }
    catch { Write-Host "  [erro leitura] $t off=$off -> $_" -ForegroundColor Red; break }
    if ($null -eq $rows) { break }
    $rows = @($rows)
    if ($rows.Count -eq 0) { break }
    $lidos += $rows.Count
    if ($rows.Count -eq 1) { $json = "[" + (ConvertTo-Json $rows[0] -Depth 30 -Compress) + "]" }
    else { $json = $rows | ConvertTo-Json -Depth 30 -Compress }
    $bytes = [Text.Encoding]::UTF8.GetBytes($json)
    try {
      Invoke-RestMethod -Uri "$newUrl/rest/v1/$t" -Headers $nh -Method Post -Body $bytes -ContentType "application/json; charset=utf-8" -ErrorAction Stop | Out-Null
      $enviados += $rows.Count
      Write-Host "  [OK] $($rows.Count) enviados (off=$off)" -ForegroundColor Green
    } catch {
      Write-Host "  [ERRO escrita] $t off=$off -> $_" -ForegroundColor Red
      "[$t off=$off] $_" | Out-File $log -Append -Encoding UTF8
      $json | Out-File "erro-$t-$off.json" -Encoding UTF8
    }
    if ($rows.Count -lt $page) { break }
    $off += $page
  }
  "[$t] lidos=$lidos enviados=$enviados" | Out-File $log -Append -Encoding UTF8
  Write-Host "  -> $t : lidos=$lidos enviados=$enviados" -ForegroundColor Yellow
}

"=== FIM $(Get-Date) ===" | Out-File $log -Append -Encoding UTF8
Write-Host "`nMIGRACAO CONCLUIDA. Log: migracao-log.txt" -ForegroundColor Magenta
