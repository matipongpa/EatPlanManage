import crypto from 'crypto'

const LINE_API = 'https://api.line.me/v2/bot'

// Verify webhook signature from LINE to ensure request is genuine
export function verifyLineSignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET!
  const hash = crypto
    .createHmac('SHA256', secret)
    .update(body)
    .digest('base64')
  return hash === signature
}

// Send a text push message to a LINE user
export async function sendLineMessage(
  lineUserId: string,
  message: string
): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return false

  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text: message }],
    }),
  })

  return res.ok
}

// Send LINE message to multiple users — uses multicast (more efficient than loop)
export async function sendLineMulticast(
  lineUserIds: string[],
  message: string
): Promise<boolean> {
  if (lineUserIds.length === 0) return true

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return false

  const res = await fetch(`${LINE_API}/message/multicast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: lineUserIds,
      messages: [{ type: 'text', text: message }],
    }),
  })

  return res.ok
}

// Build the LINE linking URL — user opens this to add your bot
export function getLineBotLinkUrl(): string {
  const channelId = process.env.LINE_CHANNEL_ID!
  return `https://line.me/R/ti/p/@${channelId}`
}
