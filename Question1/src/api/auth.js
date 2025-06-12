
const url="http://20.244.56.144/evaluation-service/auth";
// everytime i send a post request to this url, it will give a new token
// // response will be in the form of {
// 	"token_type": "Bearer",
// 	"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ5NzA3NzIzLCJpYXQiOjE3NDk3MDc0MjMsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjUwYWZlYTgxLWEzODQtNGM4NS1hZTdiLTA0YjQ5NjE0ZGQ0MiIsInN1YiI6IjIyMDNhNTE2NTNAc3J1LmVkdS5pbiJ9LCJlbWFpbCI6IjIyMDNhNTE2NTNAc3J1LmVkdS5pbiIsIm5hbWUiOiJzYWkga3VtYXIgdGhvdGEiLCJyb2xsTm8iOiIyMjAzYTUxNjUzIiwiYWNjZXNzQ29kZSI6Ik1WR3dFRiIsImNsaWVudElEIjoiNTBhZmVhODEtYTM4NC00Yzg1LWFlN2ItMDRiNDk2MTRkZDQyIiwiY2xpZW50U2VjcmV0IjoidWRBdVB3R0Z2QVV2Q0NkUCJ9.gYDF0xep_j5VjEOTwMy5tboNAWYOJTigDkQiVYvJG_I",
// 	"expires_in": 1749707723
// }
export const getToken = async () => {
    try {
        const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: "2203a51653@sru.edu.in",
            name: "sai kumar thota",
            rollNo: "2203a51653",
            accessCode: "MVGwEF",
            clientID: "50afea81-a384-4c85-ae7b-04b49614dd42",
            clientSecret: "udAuPwGFvAUvCCdP"
        })
    });
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        return data.access_token; // Return the access token
    }
    catch (error) {
        console.error("Error fetching token:", error);
        return null; // Return null in case of error
    }
}

// This function is used to get the token synchronously, it is not recommended to use this in production code