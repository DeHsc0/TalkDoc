import { WebhookEvent } from "@clerk/express";
import { Request, Response } from "express";
import { Webhook } from "svix";
import { db } from "@repo/database"
import { users } from "@repo/database/schema";
import { eq } from "drizzle-orm";

export async function webHookController( req : Request , res : Response) {

    if(!process.env.CLERK_SIGNING_SECRET){
        
        return res.status(500).json({
            success : false,
            error : "Webhook secret not configured"
        })

    }

    const svixId = req.header("svix-id")

    const svixTimestamp = req.header("svix-timestamp")

    const svixSignature = req.header("svix-signature")

    if (!svixId || !svixSignature || !svixTimestamp) {
        return res.json({ 
            error: "Missing required Svix headers" 
        }).status(400)
    }

    const payload = req.body

    const body = JSON.stringify(payload)

    const wh = new Webhook(process.env.CLERK_SIGNING_SECRET)

    let evt : WebhookEvent

    try{

        evt = wh.verify(body, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        }) as WebhookEvent
        
    } catch (err) {

        return res.json({
            success : false,
            error : "Invalid webhook signature"
        }).status(401)

    }

    const evtType = evt.type
   
    if( evtType === "user.created" && evt.data){

        try{

            const { email_addresses , username , id } = evt.data

            if(username === null)return res.json({
                success : false,
                error : "Please provide a username"
            }).status(400)

            if(!email_addresses[0])return res.status(400).json({
                success : false,
                error : "Please provide an email address"
            })

            const response =  db.insert(users).values({

                username,
                email : email_addresses[0].email_address,
                clerkId : id

            })

            return res.json({
                success : true,
                message : "User created successfully"
            }).status(201)
 
        }
        catch(err){

            return res.json({
                success : false,
                error : "Failed to create user"
            }).status(500)
        }


    } else if( evtType === "user.deleted" && evt.data){

        const { id } = evt.data

        if(!id)return res.json({
            success : false,
            error : "Missing Id"
        }).status(500)

        try {

            await db.delete(users).where(eq(users.clerkId , id))
            
        } catch (err) {

            return res.status(500).json({

                success : false,
                error : "Failed to delete user"

            })

        }

        return res.status(200).json({
            success : true,
            message : "User Deleted Successfully"
        })

    } else if ( evtType === "user.updated"){

        const { id , email_addresses , username  } = evt.data

        if(!email_addresses[0]) {

            return res.status(400).json({
                success : false,
                error : "Missing email address"
            })

        }
        
        if(username === null){
            return res.status(400).json({

                success : false,
                error : "Missing username"

            })
        }

        const emailAddress = email_addresses[0].email_address

        try {

            await db.update(users).set({
                email : emailAddress,
                username
            }).where(eq( users.clerkId , id))

        } catch (err) {

            return res.status(500).json({

                success : false,
                error : "Failed to update user"

            })

        }

        
        return res.status(200).json({
            success : true,
            message : "User Updated Successfully"
        })


    } 

}  


