import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertClientSchema, 
  insertWalkerSchema, 
  insertPetSchema, 
  insertWalkSchema, 
  insertMessageSchema,
  Walk
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    const userWithRole = await storage.getUserWithRole(user.id);
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        ...(userWithRole?.clientDetails && { clientDetails: userWithRole.clientDetails }),
        ...(userWithRole?.walkerDetails && { walkerDetails: userWithRole.walkerDetails })
      }
    });
  });

  // User routes
  app.get("/api/users", async (_req: Request, res: Response) => {
    const users = await storage.getAllUsers();
    res.json(users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive
    })));
  });
  
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const userWithRole = await storage.getUserWithRole(id);
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      ...(userWithRole?.clientDetails && { clientDetails: userWithRole.clientDetails }),
      ...(userWithRole?.walkerDetails && { walkerDetails: userWithRole.walkerDetails })
    });
  });
  
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });
  
  app.put("/api/users/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    try {
      const updatedUser = await storage.updateUser(id, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        phone: updatedUser.phone,
        isActive: updatedUser.isActive
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });

  // Client routes
  app.get("/api/clients", async (req: Request, res: Response) => {
    // Check if we need to include balances
    const withBalances = req.query.withBalances === 'true';
    
    try {
      // Use the appropriate method based on the query parameter
      const clients = withBalances 
        ? await storage.getAllClientsWithBalances()
        : await storage.getAllClients();
      
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Error fetching clients" });
    }
  });
  
  app.get("/api/clients/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    console.log(`GET /api/clients/${id} - Getting client details with pets`);
    
    if (isNaN(id)) {
      console.log(`GET /api/clients/${id} - Invalid client ID`);
      return res.status(400).json({ message: "Invalid client ID" });
    }
    
    // First, check if the ID is a client ID
    let client = await storage.getClient(id);
    
    // If not a client ID, check if it's a user ID
    if (!client) {
      console.log(`GET /api/clients/${id} - No client with ID ${id}, checking if it's a user ID`);
      const clientByUserId = await storage.getClientByUserId(id);
      
      if (clientByUserId) {
        console.log(`GET /api/clients/${id} - Found client with user ID ${id}:`, clientByUserId);
        client = clientByUserId;
      } else {
        console.log(`GET /api/clients/${id} - Client not found by user ID either`);
        return res.status(404).json({ message: "Client not found" });
      }
    }
    
    console.log(`GET /api/clients/${id} - Found client:`, client);
    
    // Get client with pets (uses client ID, not user ID)
    const clientWithPets = await storage.getClientWithPets(client.id);
    
    if (!clientWithPets) {
      console.log(`GET /api/clients/${id} - Client user not found`);
      return res.status(404).json({ message: "Client user not found" });
    }
    
    console.log(`GET /api/clients/${id} - Sending client with pets:`, clientWithPets);
    
    res.json(clientWithPets);
  });
  
  app.post("/api/clients", async (req: Request, res: Response) => {
    try {
      const { user, client } = req.body;
      
      const userData = insertUserSchema.parse({
        ...user,
        role: "client"
      });
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      const createdUser = await storage.createUser(userData);
      
      const clientData = insertClientSchema.parse({
        ...client,
        userId: createdUser.id
      });
      
      const createdClient = await storage.createClient(clientData);
      
      res.status(201).json({
        ...createdUser,
        clientDetails: createdClient
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });
  
  app.put("/api/clients/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    
    const client = await storage.getClient(id);
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    try {
      const { user, client: clientData } = req.body;
      
      if (user) {
        await storage.updateUser(client.userId, user);
      }
      
      if (clientData) {
        await storage.updateClient(id, clientData);
      }
      
      const updatedClientWithPets = await storage.getClientWithPets(id);
      
      res.json(updatedClientWithPets);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });

  // Walker routes
  app.get("/api/walkers", async (_req: Request, res: Response) => {
    const walkers = await storage.getAllWalkers();
    res.json(walkers);
  });
  
  app.get("/api/walkers/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid walker ID" });
    }
    
    const walker = await storage.getWalker(id);
    
    if (!walker) {
      return res.status(404).json({ message: "Walker not found" });
    }
    
    const user = await storage.getUser(walker.userId);
    
    if (!user) {
      return res.status(404).json({ message: "Walker user not found" });
    }
    
    res.json({
      ...user,
      walkerDetails: walker
    });
  });
  
  app.post("/api/walkers", async (req: Request, res: Response) => {
    try {
      const { user, walker } = req.body;
      
      const userData = insertUserSchema.parse({
        ...user,
        role: "walker"
      });
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      const createdUser = await storage.createUser(userData);
      
      const walkerData = insertWalkerSchema.parse({
        ...walker,
        userId: createdUser.id
      });
      
      const createdWalker = await storage.createWalker(walkerData);
      
      res.status(201).json({
        ...createdUser,
        walkerDetails: createdWalker
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });
  
  app.put("/api/walkers/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid walker ID" });
    }
    
    const walker = await storage.getWalker(id);
    
    if (!walker) {
      return res.status(404).json({ message: "Walker not found" });
    }
    
    try {
      const { user, walker: walkerData } = req.body;
      
      if (user) {
        await storage.updateUser(walker.userId, user);
      }
      
      if (walkerData) {
        await storage.updateWalker(id, walkerData);
      }
      
      const updatedWalker = await storage.getWalker(id);
      const updatedUser = await storage.getUser(walker.userId);
      
      res.json({
        ...updatedUser,
        walkerDetails: updatedWalker
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });

  // Pet routes
  app.get("/api/clients/:clientId/pets", async (req: Request, res: Response) => {
    const clientId = parseInt(req.params.clientId);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    
    const client = await storage.getClient(clientId);
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    const pets = await storage.getPetsByClientId(clientId);
    res.json(pets);
  });
  
  app.get("/api/pets/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid pet ID" });
    }
    
    const pet = await storage.getPet(id);
    
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }
    
    res.json(pet);
  });
  
  app.post("/api/clients/:clientId/pets", async (req: Request, res: Response) => {
    const clientId = parseInt(req.params.clientId);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    
    const client = await storage.getClient(clientId);
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    try {
      const petData = insertPetSchema.parse({
        ...req.body,
        clientId
      });
      
      const pet = await storage.createPet(petData);
      res.status(201).json(pet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });
  
  app.put("/api/pets/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid pet ID" });
    }
    
    const pet = await storage.getPet(id);
    
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }
    
    try {
      const updatedPet = await storage.updatePet(id, req.body);
      res.json(updatedPet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });

  // Walk routes
  app.get("/api/walks", async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const walks = await storage.getWalksByStatus(status);
    res.json(walks);
  });
  
  app.get("/api/walks/upcoming", async (_req: Request, res: Response) => {
    const walks = await storage.getUpcomingWalks();
    res.json(walks);
  });
  
  app.get("/api/walks/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid walk ID" });
    }
    
    const walk = await storage.getWalkWithDetails(id);
    
    if (!walk) {
      return res.status(404).json({ message: "Walk not found" });
    }
    
    res.json(walk);
  });
  
  app.get("/api/clients/:clientId/walks", async (req: Request, res: Response) => {
    const clientId = parseInt(req.params.clientId);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    
    // First, check if the ID is a client ID
    let client = await storage.getClient(clientId);
    
    // If not a client ID, check if it's a user ID
    if (!client) {
      console.log(`GET /api/clients/${clientId}/walks - No client with ID ${clientId}, checking if it's a user ID`);
      const clientByUserId = await storage.getClientByUserId(clientId);
      
      if (clientByUserId) {
        console.log(`GET /api/clients/${clientId}/walks - Found client with user ID ${clientId}:`, clientByUserId);
        client = clientByUserId;
      } else {
        console.log(`GET /api/clients/${clientId}/walks - Client not found by user ID either`);
        return res.status(404).json({ message: "Client not found" });
      }
    }
    
    // Now we have the client, get the walks for that client ID
    const walks = await storage.getWalksByClientId(client.id);
    res.json(walks);
  });
  
  app.get("/api/walkers/:walkerId/walks", async (req: Request, res: Response) => {
    const walkerId = parseInt(req.params.walkerId);
    
    if (isNaN(walkerId)) {
      return res.status(400).json({ message: "Invalid walker ID" });
    }
    
    const walker = await storage.getWalker(walkerId);
    
    if (!walker) {
      return res.status(404).json({ message: "Walker not found" });
    }
    
    const walks = await storage.getWalksByWalkerId(walkerId);
    res.json(walks);
  });
  
  // Walker earnings routes
  app.get("/api/walkers/:walkerId/earnings", async (req: Request, res: Response) => {
    const walkerId = parseInt(req.params.walkerId);
    
    if (isNaN(walkerId)) {
      return res.status(400).json({ message: "Invalid walker ID" });
    }
    
    const walker = await storage.getWalker(walkerId);
    
    if (!walker) {
      return res.status(404).json({ message: "Walker not found" });
    }
    
    try {
      const earnings = await storage.getWalkerEarnings(walkerId);
      res.json(earnings);
    } catch (error) {
      console.error("Error fetching walker earnings:", error);
      res.status(500).json({ message: "Error fetching walker earnings" });
    }
  });
  
  app.get("/api/walkers/:walkerId/unpaid-earnings", async (req: Request, res: Response) => {
    const walkerId = parseInt(req.params.walkerId);
    
    if (isNaN(walkerId)) {
      return res.status(400).json({ message: "Invalid walker ID" });
    }
    
    const walker = await storage.getWalker(walkerId);
    
    if (!walker) {
      return res.status(404).json({ message: "Walker not found" });
    }
    
    try {
      const earnings = await storage.getUnpaidWalkerEarnings(walkerId);
      res.json(earnings);
    } catch (error) {
      console.error("Error fetching unpaid walker earnings:", error);
      res.status(500).json({ message: "Error fetching unpaid walker earnings" });
    }
  });
  
  // Walker payments route
  app.get("/api/walkers/:walkerId/payments", async (req: Request, res: Response) => {
    const walkerId = parseInt(req.params.walkerId);
    
    if (isNaN(walkerId)) {
      return res.status(400).json({ message: "Invalid walker ID" });
    }
    
    const walker = await storage.getWalker(walkerId);
    
    if (!walker) {
      return res.status(404).json({ message: "Walker not found" });
    }
    
    try {
      const payments = await storage.getWalkerPayments(walkerId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching walker payments:", error);
      res.status(500).json({ message: "Error fetching walker payments" });
    }
  });
  
  // Record walker payment
  app.post("/api/walkers/:walkerId/payments", async (req: Request, res: Response) => {
    const walkerId = parseInt(req.params.walkerId);
    
    if (isNaN(walkerId)) {
      return res.status(400).json({ message: "Invalid walker ID" });
    }
    
    const walker = await storage.getWalker(walkerId);
    
    if (!walker) {
      return res.status(404).json({ message: "Walker not found" });
    }
    
    try {
      const { amount, paymentDate, paymentMethod, notes } = req.body;
      
      if (!amount || !paymentDate || !paymentMethod) {
        return res.status(400).json({ message: "Missing required payment information" });
      }
      
      // Process the walker payment
      const payment = await storage.processWalkerPayment(
        walkerId,
        parseFloat(amount),
        paymentDate,
        paymentMethod,
        notes
      );
      
      res.status(201).json({
        success: true,
        payment,
        message: `Payment of $${amount} recorded for walker ID ${walkerId}`
      });
    } catch (error) {
      console.error("Error processing walker payment:", error);
      res.status(500).json({ message: "Error processing walker payment" });
    }
  });
  
  app.post("/api/walks", async (req: Request, res: Response) => {
    try {
      console.log("Received walk data:", JSON.stringify(req.body, null, 2));
      
      // Special handling for 'overnight' duration which can be a string
      const requestData = {...req.body};
      
      // Parse the data with our schema
      const walkData = insertWalkSchema.parse(requestData);
      console.log("Parsed walk data:", walkData);
      
      // Validate client exists  
      console.log(`Creating walk with client ID: ${walkData.clientId} and date: ${walkData.date}`);
      // Log the exact date string received
      console.log(`Date received from client: ${walkData.date}, type: ${typeof walkData.date}`);
      
      const client = await storage.getClient(walkData.clientId);
      if (!client) {
        return res.status(404).json({ message: `Client not found with ID: ${walkData.clientId}` });
      }
      
      // Validate primary pet exists and belongs to client
      const pet = await storage.getPet(walkData.petId);
      if (!pet) {
        return res.status(404).json({ message: `Pet not found with ID: ${walkData.petId}` });
      }
      if (pet.clientId !== walkData.clientId) {
        return res.status(400).json({ 
          message: `Pet (ID: ${pet.id}) does not belong to this client (ID: ${walkData.clientId})` 
        });
      }
      
      // Validate all additional pets if allPetIds is provided
      if (walkData.allPetIds) {
        try {
          const petIds = walkData.allPetIds.split(',').map(Number);
          
          // Verify each pet in the list
          for (const petId of petIds) {
            if (isNaN(petId)) {
              return res.status(400).json({ message: `Invalid pet ID in allPetIds: ${petId}` });
            }
            
            const additionalPet = await storage.getPet(petId);
            if (!additionalPet) {
              return res.status(404).json({ message: `Additional pet not found with ID: ${petId}` });
            }
            if (additionalPet.clientId !== walkData.clientId) {
              return res.status(400).json({ 
                message: `Additional pet (ID: ${petId}) does not belong to this client (ID: ${walkData.clientId})` 
              });
            }
          }
        } catch (error) {
          console.error("Error processing allPetIds:", error);
          return res.status(400).json({ message: "Invalid format for allPetIds. Please use comma-separated numbers." });
        }
      }
      
      // Validate walker exists if provided
      if (walkData.walkerId) {
        const walker = await storage.getWalker(walkData.walkerId);
        if (!walker) {
          return res.status(404).json({ message: `Walker not found with ID: ${walkData.walkerId}` });
        }
      }

      // Check if this is a recurring walk
      if (walkData.repeatWeekly) {
        // Default to 4 weeks if numberOfWeeks is null, or use the specified number
        const weeksToRepeat = walkData.numberOfWeeks === null ? Infinity : walkData.numberOfWeeks;
        console.log(`Creating recurring walk series for ${weeksToRepeat === Infinity ? 'unlimited' : weeksToRepeat} weeks`);
        
        // Generate a unique ID for this recurring walk group
        const recurringGroupId = `recur_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        
        const walks = [];
        
        // Create the base walk and the recurring walks
        // If weeksToRepeat is null, undefined or Infinity, we'll create a reasonable number (52 weeks/1 year)
        const weeksCount = weeksToRepeat === null || weeksToRepeat === undefined || weeksToRepeat === Infinity ? 52 : weeksToRepeat;
        // Ensure we have a valid number for the loop
        const loopCount = typeof weeksCount === 'number' ? weeksCount : 52;
        for (let i = 0; i < loopCount; i++) {
          // Clone walk data for this instance
          const weeklyWalkData = { ...walkData, recurringGroupId };
          
          // If not the first walk, calculate the new date (i weeks from original date)
          if (i > 0) {
            // Parse the date string directly to ensure timezone-safe date calculations
            const [year, month, day] = walkData.date.split('-').map(Number);
            // Create date using local values (month is 0-indexed in JS Date)
            const originalDate = new Date(year, month - 1, day);
            // Add i weeks (7 days per week)
            const newDate = new Date(year, month - 1, day + (i * 7));
            // Format back to YYYY-MM-DD, ensuring to pad months and days with leading zeros if needed
            const newYear = newDate.getFullYear();
            const newMonth = String(newDate.getMonth() + 1).padStart(2, '0');
            const newDay = String(newDate.getDate()).padStart(2, '0');
            weeklyWalkData.date = `${newYear}-${newMonth}-${newDay}`;
            
            console.log(`Original date: ${walkData.date}, New recurring date: ${weeklyWalkData.date}`);
          }
          
          // Create this walk instance
          const walk = await storage.createWalk(weeklyWalkData);
          console.log(`Created recurring walk #${i+1}:`, walk);
          
          walks.push(walk);
        }
        
        // Get first walk with details for response
        const firstWalkWithDetails = await storage.getWalkWithDetails(walks[0].id);
        
        // Return the first walk with the total count
        res.status(201).json({
          ...firstWalkWithDetails,
          recurringGroupId,
          recurringCount: walks.length
        });
      } else {
        // Create a single walk (non-recurring)
        const walk = await storage.createWalk(walkData);
        console.log("Walk created:", walk);
        
        // Get walk with details for response
        const walkWithDetails = await storage.getWalkWithDetails(walk.id);
        
        res.status(201).json(walkWithDetails);
      }
    } catch (error) {
      console.error("Error creating walk:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error in walk data", 
          errors: error.errors 
        });
      }
      
      // Send a generic error response
      return res.status(500).json({ 
        message: "Error creating walk", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.put("/api/walks/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid walk ID" });
    }
    
    const walk = await storage.getWalk(id);
    
    if (!walk) {
      return res.status(404).json({ message: "Walk not found" });
    }
    
    try {
      // Check if walk is being marked as completed
      const wasCompleted = walk.status === "completed";
      const isBeingMarkedCompleted = req.body.status === "completed" && walk.status !== "completed";
      
      console.log(`Walk ID ${id} update: current status=${walk.status}, new status=${req.body.status}`);
      console.log(`isBeingMarkedCompleted: ${isBeingMarkedCompleted}, wasCompleted: ${wasCompleted}`);
      
      // Remove isPaid from request body since we're not using it anymore
      const { isPaid, ...updateData } = req.body;
      
      // Update the walk
      const updatedWalk = await storage.updateWalk(id, updateData);
      
      if (!updatedWalk) {
        return res.status(404).json({ message: "Walk not found" });
      }
      
      // If walk is being marked as completed, add billing amount to client balance
      if (isBeingMarkedCompleted) {
        const billingAmount = parseFloat(walk.billingAmount || "0");
        
        // Only update if there's a positive amount
        if (billingAmount > 0) {
          console.log(`Adding ${billingAmount} to client ${walk.clientId} balance from walk ${id}`);
          
          try {
            // Add billing amount to client balance
            const updatedClient = await storage.updateClientBalance(walk.clientId, billingAmount);
            
            console.log(`Updated client balance: ${updatedClient?.balance}`);
            
            // Apply walker earnings for this completed walk
            if (walk.walkerId) {
              console.log(`Creating earnings record for walker ${walk.walkerId} from walk ${id}`);
              
              try {
                // Calculate and create earnings record
                const earningsCount = await storage.applyWalkerEarningsForCompletedWalks();
                console.log(`Created ${earningsCount} new earnings records`);
              } catch (error) {
                console.error(`Error creating walker earnings: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          } catch (error) {
            console.error(`Error updating client balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
      
      const walkWithDetails = await storage.getWalkWithDetails(updatedWalk.id);
      
      res.json(walkWithDetails);
    } catch (error) {
      console.error("Error updating walk:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });
  
  app.delete("/api/walks/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid walk ID" });
    }
    
    try {
      const success = await storage.deleteWalk(id);
      
      if (!success) {
        return res.status(404).json({ message: "Walk not found" });
      }
      
      res.json({ success: true, message: "Walk deleted successfully" });
    } catch (error) {
      console.error("Error deleting walk:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Walk photo routes
  app.get("/api/walks/:walkId/photos", async (req: Request, res: Response) => {
    const walkId = parseInt(req.params.walkId);
    
    if (isNaN(walkId)) {
      return res.status(400).json({ message: "Invalid walk ID" });
    }
    
    const walk = await storage.getWalk(walkId);
    
    if (!walk) {
      return res.status(404).json({ message: "Walk not found" });
    }
    
    const photos = await storage.getWalkPhotos(walkId);
    res.json(photos);
  });
  
  app.post("/api/walks/:walkId/photos", async (req: Request, res: Response) => {
    const walkId = parseInt(req.params.walkId);
    
    if (isNaN(walkId)) {
      return res.status(400).json({ message: "Invalid walk ID" });
    }
    
    const walk = await storage.getWalk(walkId);
    
    if (!walk) {
      return res.status(404).json({ message: "Walk not found" });
    }
    
    try {
      // In a real application, we would handle file uploads here
      // For now, we just store the URL
      const photoData = {
        walkId,
        photoUrl: req.body.photoUrl
      };
      
      const photo = await storage.createWalkPhoto(photoData);
      res.status(201).json(photo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });

  // Message routes
  app.get("/api/messages/:user1Id/:user2Id", async (req: Request, res: Response) => {
    const user1Id = parseInt(req.params.user1Id);
    const user2Id = parseInt(req.params.user2Id);
    
    if (isNaN(user1Id) || isNaN(user2Id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user1 = await storage.getUser(user1Id);
    const user2 = await storage.getUser(user2Id);
    
    if (!user1 || !user2) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const messages = await storage.getMessagesBetweenUsers(user1Id, user2Id);
    res.json(messages);
  });
  
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      
      const sender = await storage.getUser(messageData.senderId);
      const receiver = await storage.getUser(messageData.receiverId);
      
      if (!sender || !receiver) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });
  
  app.put("/api/messages/:id/read", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }
    
    const updatedMessage = await storage.markMessageAsRead(id);
    
    if (!updatedMessage) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    res.json(updatedMessage);
  });
  
  app.get("/api/users/:userId/unread-messages", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const count = await storage.getUnreadMessageCount(userId);
    res.json({ count });
  });
  
  // Billing routes
  app.put("/api/walks/:id/payment-status", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid walk ID" });
    }
    
    const { isBalanceApplied, stripePaymentIntentId } = req.body;
    
    if (typeof isBalanceApplied !== 'boolean') {
      return res.status(400).json({ message: "isBalanceApplied must be a boolean value" });
    }
    
    const walk = await storage.getWalkWithDetails(id);
    
    if (!walk) {
      return res.status(404).json({ message: "Walk not found" });
    }
    
    // If marking as applied to balance, update the walk
    const updateData: Partial<Walk> = { 
      isBalanceApplied,
      // Store Stripe payment intent ID if provided (future Stripe integration)
      ...(stripePaymentIntentId && { stripePaymentIntentId })
    };
    
    // If applying to balance, apply it to the client's balance
    if (isBalanceApplied && walk.status === 'completed' && !walk.isBalanceApplied) {
      // Get the billing amount as a number
      const billingAmount = Number(walk.billingAmount || 0);
      
      if (billingAmount > 0) {
        // Update the client's balance
        const updatedClient = await storage.updateClientBalance(walk.clientId, billingAmount);
        
        if (!updatedClient) {
          return res.status(500).json({ message: "Failed to update client balance" });
        }
      }
    }
    
    const updatedWalk = await storage.updateWalk(id, updateData);
    
    if (!updatedWalk) {
      return res.status(500).json({ message: "Failed to update walk payment status" });
    }
    
    // Return the updated walk along with client details for UI updates
    const client = await storage.getClient(walk.clientId);
    
    res.json({
      walk: updatedWalk,
      client
    });
  });
  
  // Route to update outstanding walks (unpaid walks that are at least 1 day old)
  app.post("/api/walks/update-outstanding", async (_req: Request, res: Response) => {
    try {
      const count = await storage.updateOutstandingWalks();
      res.json({ 
        success: true, 
        message: `${count} walks marked as outstanding`, 
        count 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: `Failed to update outstanding walks: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  app.post("/api/walks/update-completed", async (_req: Request, res: Response) => {
    try {
      // Step 1: Mark walks as completed
      const completedCount = await storage.updateCompletedWalks();
      
      // Step 2: Apply the completed walks to client balances (this is already called in updateCompletedWalks)
      // But we'll call it again to make sure all walks are processed (in case there was a previous issue)
      const balanceCount = await storage.applyCompletedWalksToClientBalances();
      
      // Step 3: Apply walker earnings for completed walks
      const earningsCount = await storage.applyWalkerEarningsForCompletedWalks();
      
      res.json({ 
        success: true, 
        message: `${completedCount} walks marked as completed, ${balanceCount} walks applied to client balances, and ${earningsCount} earnings records created`, 
        completedCount,
        balanceCount,
        earningsCount
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: `Failed to update completed walks: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });
  
  // Debug endpoint to force apply completed walks to client balances
  app.post("/api/walks/apply-balances", async (_req: Request, res: Response) => {
    try {
      // Manually apply completed walks to client balances
      const count = await storage.applyCompletedWalksToClientBalances();
      res.json({ 
        success: true, 
        message: `Applied ${count} walks to client balances`, 
        count 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: `Failed to apply walks to balances: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Debug endpoint to force apply walker earnings for all completed walks
  app.post("/api/walks/apply-walker-earnings", async (_req: Request, res: Response) => {
    try {
      // Apply earnings for all completed walks
      const earningsCount = await storage.applyWalkerEarningsForCompletedWalks();
      
      // Also update the total and unpaid earnings for all walkers to ensure they're accurate
      const walkers = await storage.getAllWalkers();
      let updatedWalkers = 0;
      
      for (const walker of walkers) {
        if (walker.walkerDetails) {
          const walkerId = walker.walkerDetails.id;
          
          // Calculate total earnings
          const allEarnings = (await storage.getWalkerEarnings(walkerId))
            .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
          
          // Calculate unpaid earnings
          const unpaidTotal = (await storage.getUnpaidWalkerEarnings(walkerId))
            .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
          
          // Update walker record - convert numbers to strings to match the schema
          await storage.updateWalker(walkerId, {
            totalEarnings: allEarnings.toFixed(2),
            unpaidEarnings: unpaidTotal.toFixed(2)
          });
          
          updatedWalkers++;
        }
      }
      
      res.status(200).json({ 
        success: true,
        message: `Applied earnings for completed walks. Created ${earningsCount} new earnings records. Updated ${updatedWalkers} walkers' earnings totals.` 
      });
    } catch (error) {
      console.error('Error applying walker earnings:', error);
      res.status(500).json({ 
        success: false,
        message: `Error applying walker earnings: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // For testing: mark some walks as completed to test client balance updates
  app.post("/api/walks/mark-test-walks-completed", async (_req: Request, res: Response) => {
    try {
      // Get all scheduled walks
      const walks = await storage.getWalksByStatus("scheduled");
      let markedCount = 0;
      
      // Mark the first 3 walks as completed
      for (let i = 0; i < Math.min(3, walks.length); i++) {
        if (walks[i] && walks[i].id) {
          await storage.updateWalk(walks[i].id, { 
            status: "completed", 
            isPaid: false, 
            isBalanceApplied: false 
          });
          markedCount++;
        }
      }
      
      // Now apply the completed walks to client balances
      const balanceCount = await storage.applyCompletedWalksToClientBalances();
      
      // Apply walker earnings for completed walks
      const earningsCount = await storage.applyWalkerEarningsForCompletedWalks();
      
      res.json({ 
        success: true, 
        markedCount, 
        balanceCount,
        earningsCount,
        message: `Marked ${markedCount} walks as completed, applied ${balanceCount} walk charges to client balances, and created ${earningsCount} earnings records` 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: `Failed to mark test walks as completed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Debug endpoint to create a test completed walk for a specific walker
  app.post("/api/walkers/:walkerId/create-test-earning", async (req: Request, res: Response) => {
    try {
      console.log("Starting create-test-earning endpoint");
      const walkerId = Number(req.params.walkerId);
      
      if (isNaN(walkerId)) {
        return res.status(400).json({ message: "Invalid walker ID" });
      }
      
      // Get the walker to verify it exists
      const walker = await storage.getWalker(walkerId);
      if (!walker) {
        return res.status(404).json({ message: "Walker not found" });
      }
      
      // The logs show clientId 6 is being used when we call this endpoint,
      // but our getPetsByClientId logs show no pets for client 6
      // Let's try to figure out why client ID 6 is being used instead of our specified ID
      const clientId = 1;
      console.log(`Setting clientId to: ${clientId}`);
      
      // Check if something is modified by the req object
      console.log("Request body:", req.body);
      console.log("Request params:", req.params);
      console.log("Request query:", req.query);
      
      // Create a test pet and store it directly
      console.log("Creating pet with clientId:", clientId);
      const testPet = await storage.createPet({
        clientId: clientId,
        name: "Test Dog",
        breed: "Mixed",
        age: 3,
        size: "medium",
        notes: "Test pet for earnings"
      });
      console.log("Created testPet:", testPet);
      
      // Let's inspect what's happening with the clientId parameter
      // We've set clientId to 1 but the log shows it's being used as 6
      console.log("About to call getPetsByClientId directly with clientId:", clientId);
      console.log("Walker details:", walker);

      // Force clientId to 1 as a number
      const forcedClientId = 1;
      
      // Try to get pets directly for client 1
      const pets = await storage.getPetsByClientId(forcedClientId);
      
      let selectedPet;
      
      if (pets.length === 0) {
        console.log("Still no pets found for client 1, something else is wrong");
        console.log("Creating a new pet for this test");
        
        // Create a test pet for client 1 matching schema
        const newPet = await storage.createPet({
          clientId: forcedClientId,
          name: "Test Emergency Pet",
          breed: "TestBreed", 
          age: 3,
          size: "medium",
          notes: "Created for test"
          // isActive will be set by default
        });
        
        // Now get the pets again, should include our new one
        const updatedPets = await storage.getPetsByClientId(forcedClientId);
        console.log("Updated pets list:", updatedPets);
        
        if (updatedPets.length === 0) {
          return res.status(500).json({ message: "Critical error: Cannot create or retrieve pets" });
        }
        
        selectedPet = updatedPets[0];
        console.log("Using pet:", selectedPet);
      } else {
        console.log("Found pets for client 1:", pets);
        selectedPet = pets[0];
        console.log("Using pet:", selectedPet);
      }
      
      // Create a completed walk based on the schema
      const today = new Date();
      
      // Looking at the schema, 'status' is not a field in the walks table
      // Let's build the payload with only the known fields matching the InsertWalk schema
      const walkData = {
        clientId,
        walkerId,
        petId: selectedPet.id,
        date: today.toISOString().split('T')[0],
        time: "14:00",
        duration: 30,
        billingAmount: 30, // Number value
        notes: "Test completed walk for earnings",
        repeatWeekly: false,
        isGroupWalk: false,
        isPaid: false,
        allPetIds: null
        // isBalanceApplied and status will be handled by storage
      };
      
      console.log("Creating walk with data:", walkData);
      
      // Create the walk
      const walk = await storage.createWalk(walkData);
      
      // After creating the walk, let's manually update its status to 'completed'
      // Skip this if storage already handles setting the status
      const updatedWalk = await storage.updateWalk(walk.id, { status: "completed" });
      
      console.log(`Created test walk: ${JSON.stringify(updatedWalk || walk)}`);
      
      // Create an earning record for this walk
      const earningsCount = await storage.applyWalkerEarningsForCompletedWalks();
      
      const walkerEarnings = await storage.getWalkerEarnings(walkerId);
      
      res.json({ 
        success: true, 
        message: `Created test completed walk and ${earningsCount} earnings for walker`, 
        walk,
        earnings: walkerEarnings
      });
    } catch (error) {
      console.error("Error creating test earnings:", error);
      res.status(500).json({ 
        success: false, 
        message: `Failed to create test earnings: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Record client payment for multiple walks
  app.post("/api/clients/:clientId/payments", async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const { amount, paymentDate, paymentMethod } = req.body;
      
      if (!amount || !paymentDate || !paymentMethod) {
        return res.status(400).json({ message: "Missing required payment information" });
      }
      
      // Record the client payment (reduces the client's balance)
      // Ensure amount is properly converted to a number
      const amountNumber = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
      
      const client = await storage.recordClientPayment(
        Number(clientId),
        amountNumber,
        paymentDate
      );
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Return the updated client info with new balance
      res.json({
        success: true,
        clientId: Number(clientId),
        amount,
        paymentDate,
        paymentMethod,
        balance: client.balance
      });
    } catch (error) {
      console.error("Error recording client payment:", error);
      return res.status(500).json({ message: "Failed to record client payment" });
    }
  });

  // Payment endpoint placeholder - Stripe integration removed
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    // Check if we have the Stripe secret key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Missing required Stripe secret key");
      return res.status(400).json({
        message: "Stripe integration is not currently available. Please use alternative payment methods."
      });
    }
    
    try {
      // Import Stripe
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      
      const { amount, clientId } = req.body;

      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }
      
      // Convert amount to cents (Stripe uses cents)
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      // Create a PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        description: `Payment for Katie's Canines client #${clientId || 'unknown'}`,
      });
      
      // Return the client secret
      res.json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error: any) {
      console.error("Stripe payment intent error:", error);
      res.status(500).json({
        message: `Error creating payment intent: ${error.message}`
      });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    // Send initial data
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'connected', 
        message: 'Connected to Katie\'s Canines WebSocket server' 
      }));
    }
    
    // Handle messages from clients
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received:', data);
        
        // Handle specific message types
        if (data.type === 'get_walks_for_walker') {
          const walkerId = parseInt(data.walkerId);
          if (!isNaN(walkerId)) {
            const walks = await storage.getWalksByWalkerId(walkerId);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ 
                type: 'walks_data', 
                walks 
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
  });
  
  // Function to broadcast updates to all connected clients
  const broadcastWalksUpdate = async (walkerId?: number) => {
    // Only send updates to clients if there are any connected
    if (clients.size === 0) return;
    
    try {
      if (walkerId) {
        // If walkerId is provided, only update walks for that walker
        const walkerWalks = await storage.getWalksByWalkerId(walkerId);
        const message = JSON.stringify({
          type: 'walks_update',
          walkerId,
          walks: walkerWalks
        });
        
        // Send to all clients (they can filter on the client side if needed)
        for (const client of clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        }
      } else {
        // Update for all walks - more general broadcast
        const allWalks = await storage.getWalksByStatus();
        const message = JSON.stringify({
          type: 'all_walks_update',
          walks: allWalks
        });
        
        for (const client of clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        }
      }
    } catch (error) {
      console.error('Error broadcasting walks update:', error);
    }
  };
  
  // Add hooks to broadcast updates after walks are modified
  const originalUpdateWalk = storage.updateWalk;
  storage.updateWalk = async function(id, walkData) {
    const result = await originalUpdateWalk.call(storage, id, walkData);
    const walk = await storage.getWalk(id);
    if (walk && walk.walkerId) {
      await broadcastWalksUpdate(walk.walkerId);
    } else {
      await broadcastWalksUpdate();
    }
    return result;
  };
  
  const originalCreateWalk = storage.createWalk;
  storage.createWalk = async function(walkData) {
    const result = await originalCreateWalk.call(storage, walkData);
    if (walkData.walkerId) {
      await broadcastWalksUpdate(walkData.walkerId);
    } else {
      await broadcastWalksUpdate();
    }
    return result;
  };
  
  const originalDeleteWalk = storage.deleteWalk;
  storage.deleteWalk = async function(id) {
    const walk = await storage.getWalk(id);
    const walkerId = walk?.walkerId;
    const result = await originalDeleteWalk.call(storage, id);
    if (walkerId) {
      await broadcastWalksUpdate(walkerId);
    } else {
      await broadcastWalksUpdate();
    }
    return result;
  };
  
  return httpServer;
}
