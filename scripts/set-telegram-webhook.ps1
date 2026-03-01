# Set Telegram webhook to your Supabase Edge Function
# 1. Replace YOUR_BOT_TOKEN below with your token from BotFather
# 2. Run: .\scripts\set-telegram-webhook.ps1

$token = "YOUR_BOT_TOKEN"
$projectRef = "exyefpzjknrgyyunsxyb"
$webhookUrl = "https://$projectRef.supabase.co/functions/v1/telegram-webhook"

$setUrl = "https://api.telegram.org/bot$token/setWebhook?url=$webhookUrl"
Write-Host "Setting webhook to: $webhookUrl"
$result = Invoke-RestMethod -Uri $setUrl -Method Get
$result | ConvertTo-Json

if ($result.ok) {
    Write-Host "`nWebhook set successfully. Parent can now send /start CODE to your bot."
} else {
    Write-Host "`nFailed:" $result.description
}
