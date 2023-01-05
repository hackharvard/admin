import Handlebars from 'handlebars'

export const templates = {
  applicationSubmitted: input => ({
    subject: 'Your application was successfully submitted!',
    html: Handlebars.compile(
      'Hello <p>{{firstName}}</p>! Congrats on your submitting your HackHarvard application! It is in review, and we will contact you shortly when we have made a decision. Best, HackHarvard Team'
    )(input)
  })
}
