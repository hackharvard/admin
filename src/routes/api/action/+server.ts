import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { adminAuth, adminDb } from '$lib/server/firebase'
import type { FirebaseError } from 'firebase-admin'
import postmark from 'postmark'
import { POSTMARK_API_TOKEN } from '$env/static/private'
import { addDataToHtmlTemplate } from '$lib/utils'
import { actionEmailTemplate } from '$lib/data/emailTemplates/actionEmailTemplate'

export const POST: RequestHandler = async ({ request, locals }) => {
  let topError
  try {
    const body = await request.json()
    let to
    let data
    const firstName = body.firstName || 'Hacker'
    try {
      switch (body.type) {
        case 'verifyEmail': {
          if (locals.user === null) {
            throw 'User not signed in.'
          }
          const link = await adminAuth.generateEmailVerificationLink(
            locals.user.email,
          )
          to = locals.user.email
          data = {
            subject: 'HackHarvard Email Change Requested',
            action: {
              link,
              name: 'Verify Email',
              buttonname: 'Confirm Email Change',
              description: `Please verify your email.`,
            },
          }
          break
        }
        case 'changeEmail': {
          if (locals.user === null) {
            throw 'User not signed in.'
          }
          if (body.newEmail) {
            const link = await adminAuth.generateVerifyAndChangeEmailLink(
              locals.user.email,
              body.newEmail,
            )
            to = body.newEmail
            data = {
              subject: 'Change Email for HackHarvard Account',
              firstName: firstName,
              action: {
                link,
                name: 'Change Email',
                description: `Please confirm that you want to change your email from ${locals.user.email} to ${body.newEmail} by clicking the button below.`,
              },
            }
          } else {
            topError = error(400, 'Invalid request body.')
          }
          break
        }
        case 'resetPassword': {
          const link = await adminAuth.generatePasswordResetLink(body.email)
          to = body.email
          data = {
            subject: 'Password Reset Requested',
            action: {
              link,
              firstName: firstName,
              name: 'Password Reset Requested',
              buttonname: 'Reset Password',
              description:
                'We recently received a request to reset the password of your HackHarvard account. To reset your password, please click the button below.',
            },
          }
          break
        }
        case 'decisionAccept': {
          const link = 'https://admin.hackharvard.io'
          to = body.email
          data = {
            subject: 'HackHarvard Admissions Update',
            action: {
              link,
              firstName: firstName,
              name: 'Congradulations!',
              buttonname: 'Accept Your Spot',
              description:
                "Congrats! We are incredibly excited to invite you to participate in this year's HackHarvard. From an incredibly competitive application pool, we were impressed by your responses, ideas, and goals. Further logistical information and ways to meet other hackers will be sent to your inboxes soon, so keep an eye out! To officially confirm your spot, please fill out this form in the next three days from receiving this email. We look forward to seeing you soon!",
            },
          }
          break
        }
        default: {
          topError = error(400, 'Invalid action type.')
        }
      }
      const template = {
        name: 'action',
        data: {
          ...data,
          app: {
            name: 'Admin',
            link: 'https://admin.hackharvard.io',
          },
        },
      }

      const htmlBody = addDataToHtmlTemplate(actionEmailTemplate, template)

      const emailData: Data.EmailData = {
        From: 'team@hackharvard.io',
        To: to,
        Cc: '',
        Subject: String(template.data.subject),
        HTMLBody: htmlBody,
        ReplyTo: 'tech@hackharvard.io',
        MessageStream: 'outbound',
      }

      try {
        const client = new postmark.ServerClient(POSTMARK_API_TOKEN)
        await client.sendEmail(emailData)
        return new Response()
      } catch (err) {
        topError = error(400, 'Failed to send email.')
      }
    } catch (err) {
      if (typeof err === 'string') {
        topError = error(400, err)
      } else {
        const typedErr = err as
          | FirebaseError
          | {
              errorInfo: 'FirebaseError'
              codePrefix: string
            }
        if ('errorInfo' in typedErr) {
          topError = error(
            400,
            typedErr.errorInfo.message ||
              'Please wait a few minutes before trying again.',
          )
        } else if ('message' in typedErr) {
          topError = error(400, typedErr.message)
        } else {
          topError = error(400, 'Something went wrong. Please try again.')
        }
      }
    }
  } catch (err) {
    topError = error(400, 'Invalid request body.')
  }
  throw topError
}
