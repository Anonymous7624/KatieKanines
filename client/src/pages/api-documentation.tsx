import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code } from "@/components/ui/code";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Smartphone, Server, Lock } from "lucide-react";

export default function ApiDocumentation() {
  return (
    <MainLayout pageTitle="API Documentation">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Katie's Canines API Documentation</CardTitle>
              <CardDescription>
                Documentation for integrating with the Katie's Canines API. Use this for mobile app development and third-party integrations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  This API documentation is designed to support iPhone app integration for all user types: administrators, clients, and walkers.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
              <TabsTrigger value="mobile">Mobile Integration</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>API Overview</CardTitle>
                  <CardDescription>
                    Essential information about the Katie's Canines API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    The Katie's Canines API is a RESTful API that provides access to all the functionality of the web application.
                    It uses standard HTTP methods and returns responses in JSON format.
                  </p>

                  <h3 className="text-lg font-semibold mt-4">Base URL</h3>
                  <Code>https://api.katiescanines.com/api</Code>

                  <h3 className="text-lg font-semibold mt-4">Content Type</h3>
                  <p>All requests should include the following header:</p>
                  <Code>Content-Type: application/json</Code>

                  <h3 className="text-lg font-semibold mt-4">Rate Limiting</h3>
                  <p>
                    The API is rate-limited to 100 requests per minute per user. 
                    If you exceed this limit, you will receive a 429 Too Many Requests response.
                  </p>

                  <h3 className="text-lg font-semibold mt-4">Errors</h3>
                  <p>
                    All errors follow a standard format with an error code and message.
                    Example error response:
                  </p>
                  <Code>{`{
  "error": {
    "code": "unauthorized",
    "message": "Invalid authentication token"
  }
}`}</Code>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="authentication">
              <Card>
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                  <CardDescription>
                    How to authenticate with the Katie's Canines API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints, you need to include 
                    the JWT token in the Authorization header of your requests.
                  </p>

                  <h3 className="text-lg font-semibold mt-4">Obtaining a Token</h3>
                  <p>To obtain a token, send a POST request to the login endpoint:</p>
                  <Code>{`POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}`}</Code>

                  <p className="mt-2">If successful, you'll receive a response containing a JWT token:</p>
                  <Code>{`{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "admin"
  }
}`}</Code>

                  <h3 className="text-lg font-semibold mt-4">Using the Token</h3>
                  <p>Include the token in the Authorization header of your requests:</p>
                  <Code>Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</Code>

                  <h3 className="text-lg font-semibold mt-4">Token Expiration</h3>
                  <p>
                    Tokens expire after 24 hours. After expiration, you'll need to obtain a new token.
                    You can also refresh your token without requiring the user to login again by using
                    the refresh token endpoint.
                  </p>
                  <Code>{`POST /auth/refresh
{
  "refreshToken": "your-refresh-token"
}`}</Code>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="endpoints">
              <Card>
                <CardHeader>
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>
                    Complete list of available API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="users">
                      <AccordionTrigger>Users</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Method</TableHead>
                              <TableHead>Endpoint</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/users</TableCell>
                              <TableCell>Get all users (admin only)</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/users/:id</TableCell>
                              <TableCell>Get user by ID</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>POST</TableCell>
                              <TableCell>/users</TableCell>
                              <TableCell>Create a new user</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>PUT</TableCell>
                              <TableCell>/users/:id</TableCell>
                              <TableCell>Update user information</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="clients">
                      <AccordionTrigger>Clients</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Method</TableHead>
                              <TableHead>Endpoint</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/clients</TableCell>
                              <TableCell>Get all clients</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/clients/:id</TableCell>
                              <TableCell>Get client by ID</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>POST</TableCell>
                              <TableCell>/clients</TableCell>
                              <TableCell>Create a new client</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>PUT</TableCell>
                              <TableCell>/clients/:id</TableCell>
                              <TableCell>Update client information</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="walkers">
                      <AccordionTrigger>Walkers</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Method</TableHead>
                              <TableHead>Endpoint</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/walkers</TableCell>
                              <TableCell>Get all walkers</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/walkers/:id</TableCell>
                              <TableCell>Get walker by ID</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>POST</TableCell>
                              <TableCell>/walkers</TableCell>
                              <TableCell>Create a new walker</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>PUT</TableCell>
                              <TableCell>/walkers/:id</TableCell>
                              <TableCell>Update walker information</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="pets">
                      <AccordionTrigger>Pets</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Method</TableHead>
                              <TableHead>Endpoint</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/clients/:clientId/pets</TableCell>
                              <TableCell>Get all pets for a client</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/pets/:id</TableCell>
                              <TableCell>Get pet by ID</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>POST</TableCell>
                              <TableCell>/clients/:clientId/pets</TableCell>
                              <TableCell>Create a new pet</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>PUT</TableCell>
                              <TableCell>/pets/:id</TableCell>
                              <TableCell>Update pet information</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="walks">
                      <AccordionTrigger>Walks</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Method</TableHead>
                              <TableHead>Endpoint</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/walks</TableCell>
                              <TableCell>Get all walks</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/walks/upcoming</TableCell>
                              <TableCell>Get upcoming walks</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/walks/:id</TableCell>
                              <TableCell>Get walk by ID</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/clients/:clientId/walks</TableCell>
                              <TableCell>Get walks for a client</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/walkers/:walkerId/walks</TableCell>
                              <TableCell>Get walks for a walker</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>POST</TableCell>
                              <TableCell>/walks</TableCell>
                              <TableCell>Create a new walk</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>PUT</TableCell>
                              <TableCell>/walks/:id</TableCell>
                              <TableCell>Update walk information</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="photos">
                      <AccordionTrigger>Walk Photos</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Method</TableHead>
                              <TableHead>Endpoint</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/walks/:walkId/photos</TableCell>
                              <TableCell>Get photos for a walk</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>POST</TableCell>
                              <TableCell>/walks/:walkId/photos</TableCell>
                              <TableCell>Upload a new photo</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="messages">
                      <AccordionTrigger>Messages</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Method</TableHead>
                              <TableHead>Endpoint</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/messages/:user1Id/:user2Id</TableCell>
                              <TableCell>Get messages between two users</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>POST</TableCell>
                              <TableCell>/messages</TableCell>
                              <TableCell>Send a new message</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>PUT</TableCell>
                              <TableCell>/messages/:id/read</TableCell>
                              <TableCell>Mark message as read</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>GET</TableCell>
                              <TableCell>/users/:userId/unread-messages</TableCell>
                              <TableCell>Get unread message count for a user</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mobile">
              <Card>
                <CardHeader>
                  <CardTitle>Mobile App Integration</CardTitle>
                  <CardDescription>
                    Guidelines for integrating with iOS mobile applications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Smartphone className="h-8 w-8 text-primary-600 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold">Mobile Architecture</h3>
                      <p className="mt-2">
                        The Katie's Canines platform is designed with a mobile-first API architecture to support seamless integration with iOS 
                        applications. All endpoints are optimized for mobile usage with efficient payload sizes and pagination support.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <Lock className="h-8 w-8 text-primary-600 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold">iOS Authentication Flow</h3>
                      <p className="mt-2">
                        The authentication system supports secure storage of tokens in iOS Keychain and biometric authentication 
                        (Face ID/Touch ID) for enhanced security and user experience. The refresh token mechanism allows for 
                        keeping users logged in without requiring frequent manual authentication.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <Server className="h-8 w-8 text-primary-600 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold">Real-time Communication</h3>
                      <p className="mt-2">
                        The platform supports real-time updates through WebSockets for messaging and walk status updates.
                        For iOS implementation, we recommend using the Socket.IO client library to maintain a consistent
                        experience between web and mobile platforms.
                      </p>
                      <p className="mt-2">
                        WebSocket endpoint: <Code>wss://api.katiescanines.com/ws</Code>
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Role-Specific Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Admin App</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>Full client and walker management</li>
                            <li>Schedule overview and editing</li>
                            <li>Billing and reporting</li>
                            <li>Push notifications for new bookings</li>
                            <li>Real-time messaging with clients and walkers</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Client App</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>Book and manage walks</li>
                            <li>View walk history with photos</li>
                            <li>GPS tracking of active walks</li>
                            <li>Push notifications for walk updates</li>
                            <li>Message walkers and admin</li>
                            <li>Manage pets profile</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Walker App</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>View daily schedule</li>
                            <li>Start/complete walks with GPS tracking</li>
                            <li>Upload walk photos</li>
                            <li>Push notifications for new assignments</li>
                            <li>Message clients and admin</li>
                            <li>View route maps and client details</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold">Push Notification Integration</h3>
                    <p className="mt-2">
                      The API integrates with Apple Push Notification Service (APNs) to deliver real-time notifications to iOS devices.
                      To register a device for push notifications, use the following endpoint:
                    </p>
                    <Code className="mt-2">{`POST /users/:userId/devices
{
  "token": "device-token-from-apns",
  "platform": "ios",
  "model": "iPhone 13"
}`}</Code>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold">iOS Development Resources</h3>
                    <p className="mt-2">
                      To help with iOS app development, we provide the following resources:
                    </p>
                    <ul className="list-disc list-inside mt-2">
                      <li>Swift API client library (available on GitHub)</li>
                      <li>Sample iOS app with authentication and API integration</li>
                      <li>Design resources including icons and UI components</li>
                      <li>Documentation for offline caching strategies</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}