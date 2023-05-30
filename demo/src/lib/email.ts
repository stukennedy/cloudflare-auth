export const sendEmail = async (email: string, magicLink: string) => {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer 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',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email }],
          subject: 'Log in',
        },
      ],
      from: { email: 'info@continuata.com' },
      content: [
        {
          type: 'text/plain',
          value: 'Your Login link: ' + magicLink,
        },
      ],
    }),
  });
  const result = await response.text();
  console.log('email result', result);
  return;
};
