import { 
  users, User, InsertUser, 
  clients, Client, InsertClient,
  walkers, Walker, InsertWalker,
  pets, Pet, InsertPet,
  walks, Walk, InsertWalk,
  walkPhotos, WalkPhoto, InsertWalkPhoto,
  messages, Message, InsertMessage,
  walkerPayments, WalkerPayment, InsertWalkerPayment,
  walkerEarnings, WalkerEarning, InsertWalkerEarning,
  UserWithRole, ClientWithPets, WalkWithDetails, WalkerEarningWithDetails
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUserWithRole(id: number): Promise<UserWithRole | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientByUserId(userId: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  getClientWithPets(id: number): Promise<ClientWithPets | undefined>;
  getAllClients(): Promise<UserWithRole[]>;
  getAllClientsWithBalances(): Promise<UserWithRole[]>; // Get all clients with their balances
  updateClientBalance(clientId: number, amount: number, isPayment?: boolean): Promise<Client | undefined>; // Update client balance (positive = add to balance, negative = payment)
  recordClientPayment(clientId: number, amount: number, paymentDate: string): Promise<Client | undefined>; // Record a client payment
  
  // Walker operations
  getWalker(id: number): Promise<Walker | undefined>;
  getWalkerByUserId(userId: number): Promise<Walker | undefined>;
  createWalker(walker: InsertWalker): Promise<Walker>;
  updateWalker(id: number, walker: Partial<Walker>): Promise<Walker | undefined>;
  getAllWalkers(): Promise<UserWithRole[]>;
  
  // Pet operations
  getPet(id: number): Promise<Pet | undefined>;
  getPetsByClientId(clientId: number): Promise<Pet[]>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: number, pet: Partial<Pet>): Promise<Pet | undefined>;
  
  // Walk operations
  getWalk(id: number): Promise<Walk | undefined>;
  getWalksByClientId(clientId: number): Promise<Walk[]>;
  getWalksByWalkerId(walkerId: number): Promise<WalkWithDetails[]>;
  getWalksByDate(date: Date): Promise<Walk[]>;
  getWalksByStatus(status?: string): Promise<WalkWithDetails[]>;
  getCompletedWalksNotAppliedToBalance(): Promise<WalkWithDetails[]>; // Get completed walks not yet applied to client balances
  getUpcomingWalks(limit?: number): Promise<WalkWithDetails[]>;
  createWalk(walk: InsertWalk): Promise<Walk>;
  updateWalk(id: number, walk: Partial<Walk>): Promise<Walk | undefined>;
  deleteWalk(id: number): Promise<boolean>;
  getWalkWithDetails(id: number): Promise<WalkWithDetails | undefined>;
  updateCompletedWalks(): Promise<number>; // Returns count of walks marked as completed
  applyCompletedWalksToClientBalances(): Promise<number>; // Apply completed walks to client balances
  
  // WalkPhoto operations
  getWalkPhotos(walkId: number): Promise<WalkPhoto[]>;
  createWalkPhoto(photo: InsertWalkPhoto): Promise<WalkPhoto>;
  
  // Message operations
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  getUnreadMessageCount(userId: number): Promise<number>;
  
  // Walker earnings operations
  getWalkerEarnings(walkerId: number): Promise<WalkerEarningWithDetails[]>;
  createWalkerEarning(earning: InsertWalkerEarning): Promise<WalkerEarning>;
  updateWalkerEarningStatus(id: number, isPaid: boolean, paymentId?: number): Promise<WalkerEarning | undefined>;
  calculateWalkerEarningForWalk(walkerId: number, walkId: number): Promise<number>; // Calculate earnings based on walker rates and walk duration
  applyWalkerEarningsForCompletedWalks(): Promise<number>; // Apply earnings when walks are completed
  getUnpaidWalkerEarnings(walkerId: number): Promise<WalkerEarningWithDetails[]>;
  
  // Walker payment operations
  getWalkerPayments(walkerId: number): Promise<WalkerPayment[]>;
  createWalkerPayment(payment: InsertWalkerPayment): Promise<WalkerPayment>;
  getWalkerPaymentDetails(paymentId: number): Promise<{payment: WalkerPayment, earnings: WalkerEarningWithDetails[]} | undefined>;
  processWalkerPayment(walkerId: number, amount: number, paymentDate: string, paymentMethod: string, notes?: string): Promise<WalkerPayment>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private walkers: Map<number, Walker>;
  private pets: Map<number, Pet>;
  private walks: Map<number, Walk>;
  private walkPhotos: Map<number, WalkPhoto>;
  private messages: Map<number, Message>;
  private walkerPayments: Map<number, WalkerPayment>;
  private walkerEarnings: Map<number, WalkerEarning>;
  
  private userIdCounter: number;
  private clientIdCounter: number;
  private walkerIdCounter: number;
  private petIdCounter: number;
  private walkIdCounter: number;
  private walkPhotoIdCounter: number;
  private messageIdCounter: number;
  private walkerPaymentIdCounter: number;
  private walkerEarningIdCounter: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.walkers = new Map();
    this.pets = new Map();
    this.walks = new Map();
    this.walkPhotos = new Map();
    this.messages = new Map();
    this.walkerPayments = new Map();
    this.walkerEarnings = new Map();
    
    this.userIdCounter = 1;
    this.clientIdCounter = 1;
    this.walkerIdCounter = 1;
    this.petIdCounter = 1;
    this.walkIdCounter = 1;
    this.walkPhotoIdCounter = 1;
    this.messageIdCounter = 1;
    this.walkerPaymentIdCounter = 1;
    this.walkerEarningIdCounter = 1;
    
    // Initialize with some demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    try {
      // Create admin user
      const admin = {
        id: this.userIdCounter++,
        username: "admin",
        password: "admin",      // Simple password for testing
        email: "admin@pawtracks.com",
        firstName: "Sarah",
        lastName: "Johnson",
        role: "admin",
        phone: "555-123-4567",
        isActive: true
      };
      this.users.set(admin.id, admin);
  
      // Create walker users with simplified passwords for testing
      const walker1 = {
        id: this.userIdCounter++,
        username: "james",
        password: "james",
        email: "jwilson@pawtracks.com",
        firstName: "James",
        lastName: "Wilson",
        role: "walker",
        phone: "555-234-5678",
        isActive: true
      };
      this.users.set(walker1.id, walker1);
      
      const walker2 = {
        id: this.userIdCounter++,
        username: "maria",
        password: "maria",
        email: "mlopez@pawtracks.com",
        firstName: "Maria",
        lastName: "Lopez",
        role: "walker",
        phone: "555-345-6789",
        isActive: true
      };
      this.users.set(walker2.id, walker2);
      
      const walker3 = {
        id: this.userIdCounter++,
        username: "david",
        password: "david",
        email: "dthomas@pawtracks.com",
        firstName: "David",
        lastName: "Thomas",
        role: "walker",
        phone: "555-456-7890",
        isActive: true
      };
      this.users.set(walker3.id, walker3);
      
      const walker4 = {
        id: this.userIdCounter++,
        username: "susan",
        password: "susan",
        email: "susan@pawtracks.com",
        firstName: "Susan",
        lastName: "Peterson",
        role: "walker",
        phone: "555-888-9999",
        isActive: true
      };
      this.users.set(walker4.id, walker4);
  
      // Create walker profiles
      const walkerProfile1 = {
        id: this.walkerIdCounter++,
        userId: walker1.id,
        bio: "Experienced dog walker with 5+ years of experience. I love all breeds and sizes!",
        availability: JSON.stringify({
          monday: ["9:00", "17:00"],
          tuesday: ["9:00", "17:00"],
          wednesday: ["9:00", "17:00"],
          thursday: ["9:00", "17:00"],
          friday: ["9:00", "17:00"]
        }),
        rating: 5,
        rate20Min: "10.00",
        rate30Min: "15.00",
        rate60Min: "30.00",
        rateOvernight: "80.00",
        totalEarnings: "0.00",
        unpaidEarnings: "0.00",
        street: "123 Walker St",
        city: "Anytown",
        state: "CA",
        zip: "12345",
        color: "#4f46e5" // Indigo
      };
      this.walkers.set(walkerProfile1.id, walkerProfile1);
      
      const walkerProfile2 = {
        id: this.walkerIdCounter++,
        userId: walker2.id,
        bio: "Certified pet trainer and walker. Specializing in high-energy dogs.",
        availability: JSON.stringify({
          monday: ["10:00", "18:00"],
          tuesday: ["10:00", "18:00"],
          wednesday: ["10:00", "18:00"],
          thursday: ["10:00", "18:00"],
          friday: ["10:00", "18:00"]
        }),
        rating: 5,
        rate20Min: "12.00",
        rate30Min: "18.00",
        rate60Min: "35.00",
        rateOvernight: "90.00",
        totalEarnings: "0.00",
        unpaidEarnings: "0.00",
        street: "456 Walker Ave",
        city: "Anytown",
        state: "CA",
        zip: "12345",
        color: "#ef4444" // Red
      };
      this.walkers.set(walkerProfile2.id, walkerProfile2);
      
      const walkerProfile3 = {
        id: this.walkerIdCounter++,
        userId: walker3.id,
        bio: "Gentle and patient walker, great with older dogs and puppies.",
        availability: JSON.stringify({
          monday: ["8:00", "16:00"],
          tuesday: ["8:00", "16:00"],
          wednesday: ["8:00", "16:00"],
          thursday: ["8:00", "16:00"],
          friday: ["8:00", "16:00"]
        }),
        rating: 5,
        rate20Min: "11.00",
        rate30Min: "17.00",
        rate60Min: "32.00",
        rateOvernight: "85.00",
        totalEarnings: "0.00",
        unpaidEarnings: "0.00",
        street: "789 Walker Blvd",
        city: "Anytown",
        state: "CA",
        zip: "12345",
        color: "#10b981" // Emerald
      };
      this.walkers.set(walkerProfile3.id, walkerProfile3);
      
      const walkerProfile4 = {
        id: this.walkerIdCounter++,
        userId: walker4.id,
        bio: "Specializing in walking multiple dogs at once. Great with socialization.",
        availability: JSON.stringify({
          monday: ["10:00", "16:00"],
          tuesday: ["10:00", "16:00"],
          wednesday: ["10:00", "16:00"],
          thursday: ["10:00", "16:00"],
          friday: ["10:00", "16:00"]
        }),
        rating: 5,
        rate20Min: "13.00",
        rate30Min: "20.00",
        rate60Min: "38.00",
        rateOvernight: "95.00",
        totalEarnings: "0.00",
        unpaidEarnings: "0.00",
        street: "101 Walker Lane",
        city: "Anytown",
        state: "CA",
        zip: "12345",
        color: "#8b5cf6" // Purple
      };
      this.walkers.set(walkerProfile4.id, walkerProfile4);

      // Create client users with simplified passwords for testing
      const client1 = {
        id: this.userIdCounter++,
        username: "alex",
        password: "alex",
        email: "asmith@example.com",
        firstName: "Alex",
        lastName: "Smith",
        role: "client",
        phone: "555-567-8901",
        isActive: true
      };
      this.users.set(client1.id, client1);
      
      const client2 = {
        id: this.userIdCounter++,
        username: "emma",
        password: "emma",
        email: "ebrown@example.com",
        firstName: "Emma",
        lastName: "Brown",
        role: "client",
        phone: "555-678-9012",
        isActive: true
      };
      this.users.set(client2.id, client2);
      
      const client3 = {
        id: this.userIdCounter++,
        username: "robert",
        password: "robert",
        email: "rjones@example.com",
        firstName: "Robert",
        lastName: "Jones",
        role: "client",
        phone: "555-789-0123",
        isActive: true
      };
      this.users.set(client3.id, client3);
      
      const client4 = {
        id: this.userIdCounter++,
        username: "sofia",
        password: "sofia",
        email: "swilliams@example.com",
        firstName: "Sofia",
        lastName: "Williams",
        role: "client",
        phone: "555-890-1234",
        isActive: true
      };
      this.users.set(client4.id, client4);

      // Create client profiles
      const clientProfile1 = {
        id: this.clientIdCounter++,
        userId: client1.id,
        address: "123 Main St, Anytown, USA",
        emergencyContact: "Jane Smith, 555-123-7890",
        notes: "Front door code: 1234",
        balance: "50.00",
        lastPaymentDate: "2023-03-15",
        stripeCustomerId: null,
        stripeSubscriptionId: null
      };
      this.clients.set(clientProfile1.id, clientProfile1);
      
      const clientProfile2 = {
        id: this.clientIdCounter++,
        userId: client2.id,
        address: "456 Oak Ave, Anytown, USA",
        emergencyContact: "John Brown, 555-234-5678",
        notes: "Leave harness on hook by door",
        balance: "25.00",
        lastPaymentDate: "2023-03-20",
        stripeCustomerId: null,
        stripeSubscriptionId: null
      };
      this.clients.set(clientProfile2.id, clientProfile2);
      
      const clientProfile3 = {
        id: this.clientIdCounter++,
        userId: client3.id,
        address: "789 Pine Rd, Anytown, USA",
        emergencyContact: "Mary Jones, 555-345-6789",
        notes: "Garage keypad code: 4321",
        balance: "75.00",
        lastPaymentDate: "2023-03-10",
        stripeCustomerId: null,
        stripeSubscriptionId: null
      };
      this.clients.set(clientProfile3.id, clientProfile3);
      
      const clientProfile4 = {
        id: this.clientIdCounter++,
        userId: client4.id,
        address: "101 Cedar Ln, Anytown, USA",
        emergencyContact: "Michael Williams, 555-456-7890",
        notes: "Key under mat",
        balance: "0.00",
        lastPaymentDate: "2023-03-25",
        stripeCustomerId: null,
        stripeSubscriptionId: null
      };
      this.clients.set(clientProfile4.id, clientProfile4);

      // Create pets for client 1
      const pet1 = {
        id: this.petIdCounter++,
        clientId: clientProfile1.id,
        name: "Max",
        breed: "Bulldog",
        age: 5,
        size: "medium",
        notes: "Friendly but pulls on leash",
        isActive: true
      };
      this.pets.set(pet1.id, pet1);
      
      const pet2 = {
        id: this.petIdCounter++,
        clientId: clientProfile1.id,
        name: "Bella",
        breed: "Retriever",
        age: 3,
        size: "large",
        notes: "Loves to play fetch",
        isActive: true
      };
      this.pets.set(pet2.id, pet2);
      
      // Create pets for client 2
      const pet3 = {
        id: this.petIdCounter++,
        clientId: clientProfile2.id,
        name: "Charlie",
        breed: "Beagle",
        age: 2,
        size: "small",
        notes: "Very energetic, needs long walks",
        isActive: true
      };
      this.pets.set(pet3.id, pet3);
      
      const pet4 = {
        id: this.petIdCounter++,
        clientId: clientProfile2.id,
        name: "Lucy",
        breed: "Poodle",
        age: 4,
        size: "medium",
        notes: "Shy with strangers, be patient",
        isActive: true
      };
      this.pets.set(pet4.id, pet4);
      
      // Create pets for client 3
      const pet5 = {
        id: this.petIdCounter++,
        clientId: clientProfile3.id,
        name: "Cooper",
        breed: "German Shepherd",
        age: 6,
        size: "large",
        notes: "Well-trained, responds to basic commands",
        isActive: true
      };
      this.pets.set(pet5.id, pet5);
      
      const pet6 = {
        id: this.petIdCounter++,
        clientId: clientProfile3.id,
        name: "Luna",
        breed: "Siberian Husky",
        age: 4,
        size: "large",
        notes: "High energy, loves to run",
        isActive: true
      };
      this.pets.set(pet6.id, pet6);
      
      // Create pets for client 4
      const pet7 = {
        id: this.petIdCounter++,
        clientId: clientProfile4.id,
        name: "Daisy",
        breed: "Shih Tzu",
        age: 8,
        size: "small",
        notes: "Senior dog, prefers slow walks",
        isActive: true
      };
      this.pets.set(pet7.id, pet7);
      
      const pet8 = {
        id: this.petIdCounter++,
        clientId: clientProfile4.id,
        name: "Rocky",
        breed: "Boxer",
        age: 3,
        size: "large",
        notes: "Very friendly but strong",
        isActive: true
      };
      this.pets.set(pet8.id, pet8);

      // Create walks
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const dayAfter = new Date();
      dayAfter.setDate(today.getDate() + 2);
      const dayAfterStr = dayAfter.toISOString().split('T')[0];
      
      // Today's walks
      const walk1 = {
        id: this.walkIdCounter++,
        clientId: clientProfile1.id,
        walkerId: walkerProfile1.id,
        petId: pet1.id,
        date: todayStr,
        time: "09:30:00",
        duration: 30,
        billingAmount: "25.00",
        notes: "Bring treats",
        status: "scheduled",
        isGroupWalk: false,
        isPaid: false,
        isBalanceApplied: false,
        paidDate: null,
        allPetIds: null,
        repeatWeekly: false,
        numberOfWeeks: null,
        recurringGroupId: null,
        stripePaymentIntentId: null
      };
      this.walks.set(walk1.id, walk1);
      
      const walk2 = {
        id: this.walkIdCounter++,
        clientId: clientProfile2.id,
        walkerId: walkerProfile2.id,
        petId: pet3.id,
        date: todayStr,
        time: "11:00:00",
        duration: 45,
        billingAmount: "35.00",
        notes: "Extra long walk requested",
        status: "scheduled",
        isGroupWalk: false,
        isPaid: true,
        isBalanceApplied: false,
        paidDate: null,
        allPetIds: null,
        repeatWeekly: false,
        numberOfWeeks: null,
        recurringGroupId: null,
        stripePaymentIntentId: null
      };
      this.walks.set(walk2.id, walk2);
      
      const walk3 = {
        id: this.walkIdCounter++,
        clientId: clientProfile3.id,
        walkerId: walkerProfile3.id,
        petId: pet5.id,
        date: todayStr,
        time: "15:30:00",
        duration: 30,
        billingAmount: "25.00",
        notes: "First time with this walker, introduce slowly",
        status: "scheduled",
        isGroupWalk: false,
        isPaid: false,
        isBalanceApplied: false,
        paidDate: null,
        allPetIds: null,
        repeatWeekly: false,
        numberOfWeeks: null,
        recurringGroupId: null,
        stripePaymentIntentId: null
      };
      this.walks.set(walk3.id, walk3);
      
      // Tomorrow's walks
      const walk4 = {
        id: this.walkIdCounter++,
        clientId: clientProfile1.id,
        walkerId: walkerProfile1.id,
        petId: pet2.id,
        date: tomorrowStr,
        time: "14:00:00",
        duration: 30,
        billingAmount: "25.00",
        notes: "",
        status: "scheduled",
        isGroupWalk: false,
        isPaid: false
      };
      this.walks.set(walk4.id, walk4);
      
      const walk5 = {
        id: this.walkIdCounter++,
        clientId: clientProfile4.id,
        walkerId: walkerProfile2.id,
        petId: pet7.id,
        date: tomorrowStr,
        time: "10:00:00",
        duration: 15,
        billingAmount: "15.00",
        notes: "Senior dog, very short and slow walk",
        status: "scheduled",
        isGroupWalk: false,
        isPaid: false
      };
      this.walks.set(walk5.id, walk5);
      
      const walk6 = {
        id: this.walkIdCounter++,
        clientId: clientProfile3.id,
        walkerId: walkerProfile3.id,
        petId: pet6.id,
        date: tomorrowStr,
        time: "16:00:00",
        duration: 45,
        billingAmount: "35.00",
        notes: "Trip to dog park included",
        status: "scheduled",
        isGroupWalk: false,
        isPaid: false
      };
      this.walks.set(walk6.id, walk6);
      
      // Day after tomorrow walks
      const walk7 = {
        id: this.walkIdCounter++,
        clientId: clientProfile2.id,
        walkerId: walkerProfile1.id,
        petId: pet4.id,
        date: dayAfterStr,
        time: "09:00:00",
        duration: 60,
        billingAmount: "45.00",
        notes: "Long morning walk",
        status: "scheduled",
        isGroupWalk: false,
        isPaid: false
      };
      this.walks.set(walk7.id, walk7);
      
      const walk8 = {
        id: this.walkIdCounter++,
        clientId: clientProfile1.id,
        walkerId: walkerProfile2.id,
        petId: pet1.id,
        date: dayAfterStr,
        time: "13:00:00",
        duration: 30,
        billingAmount: "25.00",
        notes: "Needs a lot of exercise",
        status: "scheduled",
        isGroupWalk: false,
        isPaid: false
      };
      this.walks.set(walk8.id, walk8);
      
      // Group walk
      const walk9 = {
        id: this.walkIdCounter++,
        clientId: clientProfile4.id,
        walkerId: walkerProfile4.id,
        petId: pet8.id,
        date: dayAfterStr,
        time: "15:00:00",
        duration: 45,
        billingAmount: "30.00",
        notes: "Group walk with other large dogs",
        status: "scheduled",
        isGroupWalk: true,
        isPaid: false
      };
      this.walks.set(walk9.id, walk9);
      
      console.log("Demo data initialized successfully");
    } catch (error) {
      console.error("Error initializing demo data:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userData, id, isActive: true };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserWithRole(id: number): Promise<UserWithRole | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    let userWithRole: UserWithRole = { ...user };
    
    if (user.role === 'client') {
      const client = await this.getClientByUserId(id);
      if (client) {
        userWithRole.clientDetails = client;
      }
    } else if (user.role === 'walker') {
      const walker = await this.getWalkerByUserId(id);
      if (walker) {
        userWithRole.walkerDetails = walker;
      }
    }
    
    return userWithRole;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByUserId(userId: number): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.userId === userId
    );
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    // Initialize client with default values for balance fields
    const client: Client = { 
      ...clientData, 
      id,
      balance: 0,
      lastPaymentDate: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null 
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = await this.getClient(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async getClientWithPets(id: number): Promise<ClientWithPets | undefined> {
    console.log(`getClientWithPets called with id: ${id}`);
    
    const client = await this.getClient(id);
    if (!client) {
      console.log("Client not found");
      return undefined;
    }
    
    console.log("Client found:", client);
    
    const user = await this.getUser(client.userId);
    if (!user) {
      console.log("User not found");
      return undefined;
    }
    
    console.log("User found:", user);
    
    const pets = await this.getPetsByClientId(id);
    console.log("Pets found:", pets);
    
    // Get all completed walks for this client to calculate balance
    const completedWalks = Array.from(this.walks.values())
      .filter(walk => 
        walk.clientId === id && 
        walk.status === 'completed'
      );
    
    // Calculate total from completed walks
    const totalCharges = completedWalks.reduce((sum, walk) => 
      sum + (Number(walk.billingAmount) || 0), 0
    );
    
    // Get total payments
    const totalPayments = client?.payments?.reduce((sum, payment) => 
      sum + (Number(payment.amount) || 0), 0
    ) || 0;
    
    // Calculate current balance (completed walks minus payments)
    const currentBalance = totalCharges - totalPayments;
    
    // Update client with calculated balance
    const updatedClient = {
      ...client,
      balance: currentBalance,
    };
    
    // Log the complete map of pets for debugging
    console.log("All pets in storage:", Array.from(this.pets.entries()));
    
    const result = {
      ...user,
      clientDetails: updatedClient,
      pets: pets
    };
    
    console.log("Returning clientWithPets:", result);
    return result;
  }

  async getAllClients(): Promise<UserWithRole[]> {
    const users = await this.getAllUsers();
    const clientUsers = users.filter(user => user.role === 'client');
    
    const clientsWithDetails: UserWithRole[] = [];
    
    for (const user of clientUsers) {
      const client = await this.getClientByUserId(user.id);
      if (client) {
        clientsWithDetails.push({
          ...user,
          clientDetails: client
        });
      }
    }
    
    return clientsWithDetails;
  }

  // Walker operations
  async getWalker(id: number): Promise<Walker | undefined> {
    return this.walkers.get(id);
  }

  async getWalkerByUserId(userId: number): Promise<Walker | undefined> {
    return Array.from(this.walkers.values()).find(
      (walker) => walker.userId === userId
    );
  }

  async createWalker(walkerData: InsertWalker): Promise<Walker> {
    const id = this.walkerIdCounter++;
    const walker: Walker = { ...walkerData, id, rating: 5 };
    this.walkers.set(id, walker);
    return walker;
  }

  async updateWalker(id: number, walkerData: Partial<Walker>): Promise<Walker | undefined> {
    const walker = await this.getWalker(id);
    if (!walker) return undefined;
    
    const updatedWalker = { ...walker, ...walkerData };
    this.walkers.set(id, updatedWalker);
    return updatedWalker;
  }

  async getAllWalkers(): Promise<UserWithRole[]> {
    const users = await this.getAllUsers();
    const walkerUsers = users.filter(user => user.role === 'walker');
    
    const walkersWithDetails: UserWithRole[] = [];
    
    for (const user of walkerUsers) {
      const walker = await this.getWalkerByUserId(user.id);
      if (walker) {
        walkersWithDetails.push({
          ...user,
          walkerDetails: walker
        });
      }
    }
    
    return walkersWithDetails;
  }

  // Pet operations
  async getPet(id: number): Promise<Pet | undefined> {
    return this.pets.get(id);
  }

  async getPetsByClientId(clientId: number): Promise<Pet[]> {
    console.log(`Getting pets for clientId: ${clientId}`);
    
    // Log all pets to see what we have
    const allPets = Array.from(this.pets.values());
    console.log("All pets:", allPets);
    
    // Get pets for this client
    const clientPets = allPets.filter(pet => pet.clientId === clientId);
    console.log(`Found ${clientPets.length} pets for client ${clientId}:`, clientPets);
    
    return clientPets;
  }

  async createPet(petData: InsertPet): Promise<Pet> {
    const id = this.petIdCounter++;
    const pet: Pet = { ...petData, id, isActive: true };
    this.pets.set(id, pet);
    return pet;
  }

  async updatePet(id: number, petData: Partial<Pet>): Promise<Pet | undefined> {
    const pet = await this.getPet(id);
    if (!pet) return undefined;
    
    const updatedPet = { ...pet, ...petData };
    this.pets.set(id, updatedPet);
    return updatedPet;
  }

  // Walk operations
  async getWalk(id: number): Promise<Walk | undefined> {
    return this.walks.get(id);
  }

  async getWalksByClientId(clientId: number): Promise<Walk[]> {
    return Array.from(this.walks.values()).filter(
      (walk) => walk.clientId === clientId
    );
  }

  async getWalksByWalkerId(walkerId: number): Promise<WalkWithDetails[]> {
    const filteredWalks = Array.from(this.walks.values()).filter(
      (walk) => walk.walkerId === walkerId
    );
    
    // Convert the basic walks to walks with details
    const walksWithDetails: WalkWithDetails[] = [];
    for (const walk of filteredWalks) {
      const walkWithDetails = await this.getWalkWithDetails(walk.id);
      if (walkWithDetails) {
        // Add the client address
        const client = await this.getClient(walk.clientId);
        if (client) {
          walksWithDetails.push({
            ...walkWithDetails,
            address: client.address
          });
        } else {
          walksWithDetails.push(walkWithDetails);
        }
      }
    }
    
    return walksWithDetails;
  }

  async getWalksByDate(date: Date): Promise<Walk[]> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.walks.values()).filter(
      (walk) => {
        const walkDate = new Date(walk.date).toISOString().split('T')[0];
        return walkDate === dateString;
      }
    );
  }

  async getWalksByStatus(status?: string): Promise<WalkWithDetails[]> {
    // Get all walks or filter by status if provided
    const filteredWalks = Array.from(this.walks.values()).filter(walk => {
      return status ? walk.status === status : true;
    });
    
    // Sort walks by date and time
    const sortedWalks = filteredWalks.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Convert to WalkWithDetails objects
    const detailedWalks: WalkWithDetails[] = [];
    
    for (const walk of sortedWalks) {
      const pet = await this.getPet(walk.petId);
      const client = await this.getClient(walk.clientId);
      
      if (pet && client) {
        const clientUser = await this.getUser(client.userId);
        let walkerName;
        let walkerColor;
        
        if (walk.walkerId) {
          const walker = await this.getWalker(walk.walkerId);
          if (walker) {
            const walkerUser = await this.getUser(walker.userId);
            if (walkerUser) {
              walkerName = `${walkerUser.firstName} ${walkerUser.lastName}`;
              walkerColor = walker.color;
            }
          }
        }
        
        // Process all pets if multiple pets are selected
        let allPetNames = '';
        
        // If we have allPetIds, use it to get all pet names
        if (walk.allPetIds) {
          try {
            const petIds = walk.allPetIds.split(',').map(Number);
            const petNames: string[] = [];
            
            // Get each pet and add their name to the list
            for (const petId of petIds) {
              const currentPet = await this.getPet(petId);
              if (currentPet) {
                petNames.push(currentPet.name);
              }
            }
            
            // Join all pet names with commas
            allPetNames = petNames.join(', ');
          } catch (error) {
            console.error("Error processing pet IDs:", error);
            // Fallback to primary pet if there's an error
            allPetNames = pet.name;
          }
        } else {
          // Fallback to primary pet if no allPetIds field
          allPetNames = pet.name;
        }
        
        if (clientUser) {
          detailedWalks.push({
            id: walk.id,
            clientId: walk.clientId,
            walkerId: walk.walkerId,
            petId: walk.petId,
            allPetIds: walk.allPetIds,
            date: walk.date,
            time: walk.time,
            duration: walk.duration,
            notes: walk.notes,
            billingAmount: walk.billingAmount,
            status: walk.status,
            isGroupWalk: walk.isGroupWalk,
            isPaid: walk.isPaid,
            repeatWeekly: walk.repeatWeekly || false,
            numberOfWeeks: walk.numberOfWeeks || null,
            recurringGroupId: walk.recurringGroupId || null,
            clientName: `${clientUser.firstName} ${clientUser.lastName}`,
            petName: pet.name,
            allPetNames,
            walkerName,
            walkerColor
          });
        }
      }
    }
    
    return detailedWalks;
  }

  async getUpcomingWalks(limit: number = 5): Promise<WalkWithDetails[]> {
    // Get today's date at start of day in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];
    
    const upcomingWalks = Array.from(this.walks.values())
      .filter(walk => {
        // Parse walk date in local timezone
        const walkDate = new Date(walk.date + 'T00:00:00');
        walkDate.setHours(0, 0, 0, 0);
        return walkDate >= today && walk.status === 'scheduled';
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, limit);
    
    const detailedWalks: WalkWithDetails[] = [];
    
    for (const walk of upcomingWalks) {
      const pet = await this.getPet(walk.petId);
      const client = await this.getClient(walk.clientId);
      
      if (pet && client) {
        const clientUser = await this.getUser(client.userId);
        let walkerName;
        
        let walkerColor;
        if (walk.walkerId) {
          const walker = await this.getWalker(walk.walkerId);
          if (walker) {
            const walkerUser = await this.getUser(walker.userId);
            if (walkerUser) {
              walkerName = `${walkerUser.firstName} ${walkerUser.lastName}`;
              walkerColor = walker.color;
            }
          }
        }
        
        // Process all pets if multiple pets are selected
        let allPetNames = '';
        
        // If we have allPetIds, use it to get all pet names
        if (walk.allPetIds) {
          try {
            const petIds = walk.allPetIds.split(',').map(Number);
            const petNames: string[] = [];
            
            // Get each pet and add their name to the list
            for (const petId of petIds) {
              const currentPet = await this.getPet(petId);
              if (currentPet) {
                petNames.push(currentPet.name);
              }
            }
            
            // Join all pet names with commas
            allPetNames = petNames.join(', ');
          } catch (error) {
            console.error("Error processing pet IDs:", error);
            // Fallback to primary pet if there's an error
            allPetNames = pet.name;
          }
        } else {
          // Fallback to primary pet if no allPetIds field
          allPetNames = pet.name;
        }
        
        if (clientUser) {
          detailedWalks.push({
            ...walk,
            clientName: `${clientUser.firstName} ${clientUser.lastName}`,
            petName: pet.name,
            allPetNames,
            walkerName,
            walkerColor,
            // Ensure all new fields are included
            repeatWeekly: walk.repeatWeekly || false,
            numberOfWeeks: walk.numberOfWeeks || null,
            recurringGroupId: walk.recurringGroupId || null
          });
        }
      }
    }
    
    return detailedWalks;
  }

  async createWalk(walkData: InsertWalk): Promise<Walk> {
    console.log("Creating walk with data:", walkData);
    
    const id = this.walkIdCounter++;
    
    // Convert special overnight value to a number for storage
    // In a real database implementation, we would handle this differently
    let processedData: any = { ...walkData };
    
    // For duration, convert 'overnight' to a special number (like 999 or 1440 for a full day)
    if (processedData.duration === 'overnight') {
      processedData.duration = 1440; // 24 hours in minutes
    }
    
    // Ensure all new fields are included in the walk object
    const walk: Walk = { 
      ...processedData, 
      id, 
      status: 'scheduled',
      isPaid: false,
      paidDate: null,
      // Add default values for the new fields if not already provided
      repeatWeekly: processedData.repeatWeekly || false,
      recurringGroupId: processedData.recurringGroupId || null,
      numberOfWeeks: processedData.numberOfWeeks || null,
      isBalanceApplied: false // Initialize to false
    };
    
    this.walks.set(id, walk);
    console.log("Created walk:", walk);
    return walk;
  }

  async updateWalk(id: number, walkData: Partial<Walk>): Promise<Walk | undefined> {
    const walk = await this.getWalk(id);
    if (!walk) return undefined;
    
    const updatedWalk = { ...walk, ...walkData };
    this.walks.set(id, updatedWalk);
    return updatedWalk;
  }
  
  async deleteWalk(id: number): Promise<boolean> {
    const walk = await this.getWalk(id);
    
    if (!walk) {
      return false;
    }
    
    // Delete the walk
    this.walks.delete(id);
    
    // Also delete any associated photos for this walk
    const photosToDelete: number[] = [];
    this.walkPhotos.forEach((photo, photoId) => {
      if (photo.walkId === id) {
        photosToDelete.push(photoId);
      }
    });
    
    // Delete the photos
    photosToDelete.forEach(photoId => {
      this.walkPhotos.delete(photoId);
    });
    
    return true;
  }

  async getWalkWithDetails(id: number): Promise<WalkWithDetails | undefined> {
    const walk = await this.getWalk(id);
    if (!walk) return undefined;
    
    // Get the primary pet
    const pet = await this.getPet(walk.petId);
    
    // Get the client
    const client = await this.getClient(walk.clientId);
    
    if (!pet || !client) return undefined;
    
    const clientUser = await this.getUser(client.userId);
    if (!clientUser) return undefined;
    
    // Get walker name and color if available
    let walkerName;
    let walkerColor;
    if (walk.walkerId) {
      const walker = await this.getWalker(walk.walkerId);
      if (walker) {
        const walkerUser = await this.getUser(walker.userId);
        if (walkerUser) {
          walkerName = `${walkerUser.firstName} ${walkerUser.lastName}`;
          walkerColor = walker.color;
        }
      }
    }
    
    // Process all pets if multiple pets are selected
    let allPetNames = '';
    
    // If we have allPetIds, use it to get all pet names
    if (walk.allPetIds) {
      try {
        const petIds = walk.allPetIds.split(',').map(Number);
        const petNames: string[] = [];
        
        // Get each pet and add their name to the list
        for (const petId of petIds) {
          const currentPet = await this.getPet(petId);
          if (currentPet) {
            petNames.push(currentPet.name);
          }
        }
        
        // Join all pet names with commas
        allPetNames = petNames.join(', ');
      } catch (error) {
        console.error("Error processing pet IDs:", error);
        // Fallback to primary pet if there's an error
        allPetNames = pet.name;
      }
    } else {
      // Fallback to primary pet if no allPetIds field
      allPetNames = pet.name;
    }
    
    return {
      ...walk,
      clientName: `${clientUser.firstName} ${clientUser.lastName}`,
      petName: pet.name, // Keep primary pet name for backward compatibility
      allPetNames: allPetNames, // Add all pet names as a string
      walkerName,
      walkerColor, // Add walker color for styling
      // Ensure all fields including payment status are included
      isPaid: walk.isPaid || false,
      paidDate: walk.paidDate || null,
      isBalanceApplied: walk.isBalanceApplied || false,
      repeatWeekly: walk.repeatWeekly || false,
      numberOfWeeks: walk.numberOfWeeks || 4,
      recurringGroupId: walk.recurringGroupId || null
    };
  }

  // WalkPhoto operations
  async getWalkPhotos(walkId: number): Promise<WalkPhoto[]> {
    return Array.from(this.walkPhotos.values()).filter(
      (photo) => photo.walkId === walkId
    );
  }

  async createWalkPhoto(photoData: InsertWalkPhoto): Promise<WalkPhoto> {
    const id = this.walkPhotoIdCounter++;
    const now = new Date();
    const photo: WalkPhoto = { ...photoData, id, uploadedAt: now };
    this.walkPhotos.set(id, photo);
    return photo;
  }

  // Message operations
  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(
        (message) => 
          (message.senderId === user1Id && message.receiverId === user2Id) ||
          (message.senderId === user2Id && message.receiverId === user1Id)
      )
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const message: Message = { ...messageData, id, sentAt: now, isRead: false };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values()).filter(
      (message) => message.receiverId === userId && !message.isRead
    ).length;
  }
  
  async updateOutstandingWalks(): Promise<number> {
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of today
    
    // Process all walks to check for those that should be marked as outstanding
    for (const walk of this.walks.values()) {
      // Skip walks that are already paid or already marked as outstanding
      if (walk.isPaid || walk.status === 'outstanding') {
        continue;
      }
      
      // Only consider completed walks or walks that were scheduled in the past
      if (walk.status === 'completed' || (walk.status === 'scheduled' && new Date(walk.date) < today)) {
        const walkDate = new Date(walk.date);
        walkDate.setHours(0, 0, 0, 0); // Set to beginning of walk day
        
        // Calculate the difference in days
        const diffTime = Math.abs(today.getTime() - walkDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // If the walk is at least 1 day old and not paid, mark it as outstanding
        if (diffDays >= 1) {
          walk.status = 'outstanding';
          this.walks.set(walk.id, walk);
          count++;
        }
      }
    }
    
    return count;
  }
  
  async updateCompletedWalks(): Promise<number> {
    let count = 0;
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Helper function to convert different time formats to minutes from midnight
    const convertTimeToMinutes = (time: string): number => {
      // Handle named time slots
      if (time === 'morning') return 8 * 60; // 8:00 AM
      if (time === 'midday') return 11 * 60; // 11:00 AM
      if (time === 'early_evening') return 14 * 60; // 2:00 PM
      if (time === 'late_evening') return 17 * 60; // 5:00 PM
      
      // Handle standard time format (HH:MM:SS or HH:MM)
      const timeParts = time.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        return hours * 60 + minutes;
      }
      
      return 0; // Default if format can't be parsed
    };
    
    // Track walks that we mark as completed
    const completedWalks: Walk[] = [];
    
    // Loop through all scheduled walks to check if they should be marked as completed
    for (const walk of this.walks.values()) {
      if (walk.status === 'scheduled') {
        const walkDate = walk.date;
        
        // For walks scheduled on or before the current date
        if (walkDate <= currentDate) {
          const walkStartTimeInMinutes = convertTimeToMinutes(walk.time);
          const walkDuration = typeof walk.duration === 'number' ? walk.duration : 30; // Default to 30 minutes if not specified
          const walkEndTimeInMinutes = walkStartTimeInMinutes + walkDuration;
          
          // If current date is after walk date, or it's the same day and current time is past the end time
          if (walkDate < currentDate || (walkDate === currentDate && currentTimeInMinutes >= walkEndTimeInMinutes)) {
            console.log(`Auto-marking walk ${walk.id} as completed. Client ID: ${walk.clientId}, Billing Amount: ${walk.billingAmount}`);
            
            // Mark walk as completed and IMMEDIATELY apply to client balance
            const updatedWalk = {
              ...walk,
              status: 'completed',
              isBalanceApplied: true // Already applied to client balance
            };
            
            this.walks.set(walk.id, updatedWalk);
            completedWalks.push(updatedWalk);
            count++;
          }
        }
      }
    }
    
    // Now, for each completed walk, update the client balance immediately
    for (const walk of completedWalks) {
      // Only process if it has a billing amount
      if (walk.billingAmount) {
        const amount = typeof walk.billingAmount === 'string' 
          ? parseFloat(walk.billingAmount) 
          : (typeof walk.billingAmount === 'number' ? walk.billingAmount : 0);
        
        if (amount > 0) {
          console.log(`Adding ${amount} to client ${walk.clientId} balance from auto-completed walk ${walk.id}`);
          
          try {
            // Update client balance with the billing amount
            const updatedClient = await this.updateClientBalance(walk.clientId, amount);
            console.log(`Updated client ${walk.clientId} balance to ${updatedClient?.balance}`);
          } catch (error) {
            console.error(`Error updating client balance for walk ${walk.id}:`, error);
          }
        }
      }
    }
    
    // We already applied balances directly, but run this as a fallback to catch any walks 
    // that might have been marked completed in other paths in the code
    await this.applyCompletedWalksToClientBalances();
    
    return count;
  }
  
  async getAllClientsWithBalances(): Promise<UserWithRole[]> {
    // Get all clients first
    const clients = await this.getAllClients();
    
    // Return the same array if clients is empty
    if (!clients || clients.length === 0) return clients;
    
    // For each client, calculate balance based on completed walks minus payments
    const clientsWithBalances = await Promise.all(clients.map(async (client) => {
      if (client.role !== 'client') return client;
      
      const clientDetails = client.clientDetails;
      if (!clientDetails || !clientDetails.id) return client;
      
      // Get all completed walks for this client
      const completedWalks = Array.from(this.walks.values())
        .filter(walk => 
          walk.clientId === clientDetails.id && 
          walk.status === 'completed'
        );
      
      // Calculate total from completed walks
      const totalCharges = completedWalks.reduce((sum, walk) => 
        sum + (Number(walk.billingAmount) || 0), 0
      );
      
      // Get client record for payment history
      const clientRecord = await this.getClient(clientDetails.id);
      const totalPayments = clientRecord?.payments?.reduce((sum, payment) => 
        sum + (Number(payment.amount) || 0), 0
      ) || 0;
      
      // Calculate current balance (completed walks minus payments)
      const currentBalance = totalCharges - totalPayments;
      
      // Return client with calculated balance
      return {
        ...client,
        clientDetails: {
          ...clientDetails,
          balance: currentBalance,
          lastPaymentDate: clientRecord?.lastPaymentDate || null
        }
      };
    }));
    
    return clientsWithBalances;
  }
  
  async updateClientBalance(clientId: number, amount: number, isPayment: boolean = false): Promise<Client | undefined> {
    const client = await this.getClient(clientId);
    if (!client) return undefined;
    
    // For payments (make sure we store this in client.payments)
    if (isPayment) {
      // Initialize payments array if it doesn't exist
      if (!client.payments) {
        client.payments = [];
      }
      
      // Add the new payment
      const now = new Date().toISOString().split('T')[0];
      client.payments.push({
        amount,
        date: now,
        paymentMethod: 'cash' // Default method
      });
    }
    
    // Get all completed walks for this client to calculate balance
    const completedWalks = Array.from(this.walks.values())
      .filter(walk => 
        walk.clientId === clientId && 
        walk.status === 'completed'
      );
    
    // Calculate total from completed walks
    const totalCharges = completedWalks.reduce((sum, walk) => 
      sum + (Number(walk.billingAmount) || 0), 0
    );
    
    // Get total payments
    const totalPayments = client?.payments?.reduce((sum, payment) => 
      sum + (Number(payment.amount) || 0), 0
    ) || 0;
    
    // Calculate current balance (completed walks minus payments)
    const currentBalance = totalCharges - totalPayments;
    
    // Update client with calculated balance
    const updatedClient = {
      ...client,
      balance: currentBalance,
    };
    
    // If this is a payment, update the last payment date
    if (isPayment) {
      updatedClient.lastPaymentDate = new Date().toISOString().split('T')[0];
    }
    
    this.clients.set(clientId, updatedClient);
    return updatedClient;
  }
  
  async recordClientPayment(clientId: number, amount: number, paymentDate: string): Promise<Client | undefined> {
    const client = await this.getClient(clientId);
    if (!client) return undefined;
    
    // Make sure client.payments exists
    if (!client.payments) {
      client.payments = [];
    }
    
    // Add the payment record
    client.payments.push({
      amount,
      date: paymentDate,
      paymentMethod: 'cash' // Default method
    });
    
    // Get all completed walks for this client to calculate balance
    const completedWalks = Array.from(this.walks.values())
      .filter(walk => 
        walk.clientId === clientId && 
        walk.status === 'completed'
      );
    
    // Calculate total from completed walks
    const totalCharges = completedWalks.reduce((sum, walk) => 
      sum + (Number(walk.billingAmount) || 0), 0
    );
    
    // Get total payments
    const totalPayments = client.payments.reduce((sum, payment) => 
      sum + (Number(payment.amount) || 0), 0
    );
    
    // Calculate current balance (completed walks minus payments)
    const currentBalance = totalCharges - totalPayments;
    
    // Update client with calculated balance and payment date
    const updatedClient = {
      ...client,
      balance: currentBalance,
      lastPaymentDate: paymentDate
    };
    
    // Save the updated client
    this.clients.set(clientId, updatedClient);
    
    console.log(`Updated client ${clientId} after payment of ${amount}. New balance: ${currentBalance}`);
    
    return updatedClient;
  }
  
  async getCompletedWalksNotAppliedToBalance(): Promise<WalkWithDetails[]> {
    // Find all completed walks that haven't been applied to client balance yet
    const completedWalks: WalkWithDetails[] = [];
    
    for (const [id, walk] of this.walks.entries()) {
      if (walk.status === 'completed' && walk.isBalanceApplied === false) {
        const walkWithDetails = await this.getWalkWithDetails(id);
        if (walkWithDetails) {
          completedWalks.push(walkWithDetails);
        }
      }
    }
    
    return completedWalks;
  }
  
  async applyCompletedWalksToClientBalances(): Promise<number> {
    // Get all completed walks not yet applied to balances
    const completedWalks = await this.getCompletedWalksNotAppliedToBalance();
    let updatedCount = 0;
    
    for (const walk of completedWalks) {
      // Apply billing amount to client balance
      if (walk.billingAmount) {
        const amount = typeof walk.billingAmount === 'string' 
          ? parseFloat(walk.billingAmount) 
          : walk.billingAmount;
        
        // Update client balance (add the walk amount)
        await this.updateClientBalance(walk.clientId, amount);
        
        // Mark walk as applied to balance
        await this.updateWalk(walk.id, { isBalanceApplied: true });
        
        updatedCount++;
      }
    }
    
    return updatedCount;
  }

  // Walker earnings operations
  async getWalkerEarnings(walkerId: number): Promise<WalkerEarningWithDetails[]> {
    console.log(`getWalkerEarnings called for walkerId: ${walkerId}`);
    const earnings: WalkerEarningWithDetails[] = [];
    
    // First check if the provided ID is a user ID (from URL) or a walker ID (from database)
    let walker = await this.getWalker(walkerId);
    
    // If no walker was found with the direct ID, try getting walker by user ID
    if (!walker) {
      console.log(`No walker found with direct ID ${walkerId}, trying to get walker by user ID`);
      walker = await this.getWalkerByUserId(walkerId);
      if (walker) {
        console.log(`Found walker with ID ${walker.id} by user ID ${walkerId}`);
        walkerId = walker.id; // Use the correct walker ID from now on
      }
    }
    
    if (!walker) {
      console.log(`Still no walker found for ID ${walkerId}`);
      return [];
    }
    
    console.log(`Searching earnings with walkerId ${walkerId}`);
    
    for (const earning of this.walkerEarnings.values()) {
      if (earning.walkerId === walkerId) {
        const walk = await this.getWalk(earning.walkId);
        
        if (walk) {
          const user = await this.getUser(walker.userId);
          const client = walk.clientId ? await this.getClient(walk.clientId) : null;
          const clientUser = client ? await this.getUser(client.userId) : null;
          const pet = walk.petId ? await this.getPet(walk.petId) : null;
          
          earnings.push({
            ...earning,
            walkDate: walk.date,
            walkTime: walk.time,
            walkDuration: walk.duration,
            walkerName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            clientName: clientUser ? `${clientUser.firstName} ${clientUser.lastName}` : 'Unknown',
            petName: pet ? pet.name : 'Unknown'
          });
        }
      }
    }
    
    // Sort by walk date and time
    return earnings.sort((a, b) => {
      if (a.walkDate !== b.walkDate) {
        return a.walkDate > b.walkDate ? 1 : -1;
      }
      return a.walkTime > b.walkTime ? 1 : -1;
    });
  }
  
  async createWalkerEarning(earningData: InsertWalkerEarning): Promise<WalkerEarning> {
    const id = this.walkerEarningIdCounter++;
    
    const earning: WalkerEarning = {
      ...earningData,
      id,
      isPaid: false,
      paymentId: null
    };
    
    this.walkerEarnings.set(id, earning);
    return earning;
  }
  
  async updateWalkerEarningStatus(id: number, isPaid: boolean, paymentId?: number): Promise<WalkerEarning | undefined> {
    const earning = this.walkerEarnings.get(id);
    if (!earning) return undefined;
    
    const updatedEarning: WalkerEarning = {
      ...earning,
      isPaid,
      paymentId: paymentId || earning.paymentId
    };
    
    this.walkerEarnings.set(id, updatedEarning);
    return updatedEarning;
  }
  
  async calculateWalkerEarningForWalk(walkerId: number, walkId: number): Promise<number> {
    const walker = await this.getWalker(walkerId);
    const walk = await this.getWalk(walkId);
    
    if (!walker || !walk) return 0;
    
    console.log(`Calculating earnings for walkerId ${walkerId} and walkId ${walkId}`);
    console.log(`Walk duration: ${walk.duration}, Walker rates: 20min=${walker.rate20Min}, 30min=${walker.rate30Min}, 60min=${walker.rate60Min}`);
    
    // Determine which rate to use based on walk duration
    let rate = 0;
    
    // Handle the case where duration might be a string
    const duration = typeof walk.duration === 'string' ? 
      (walk.duration === 'overnight' ? -1 : parseInt(walk.duration)) : 
      walk.duration;
    
    // Match by closest duration bucket
    if (duration === "overnight" || duration === -1) {
      // Handle overnight walks
      rate = walker.rateOvernight ? parseFloat(walker.rateOvernight) : 0;
    } else if (duration <= 20) {
      // 20 minute rate for walks up to 20 minutes
      rate = walker.rate20Min ? parseFloat(walker.rate20Min) : 0;
    } else if (duration <= 30) {
      // 30 minute rate for walks up to 30 minutes
      rate = walker.rate30Min ? parseFloat(walker.rate30Min) : 0;
    } else if (duration <= 60 || duration > 60) {
      // 60 minute rate for walks up to or over 60 minutes
      // For longer walks, we could implement a multiplier in the future
      rate = walker.rate60Min ? parseFloat(walker.rate60Min) : 0;
    }
    
    console.log(`Calculated rate: ${rate} for duration ${duration}`);
    return rate;
  }
  
  async applyWalkerEarningsForCompletedWalks(): Promise<number> {
    // Get all completed walks not yet processed for earnings
    const walks = Array.from(this.walks.values()).filter(
      walk => walk.status === 'completed' && walk.walkerId
    );
    
    console.log(`Found ${walks.length} completed walks with walker IDs assigned`);
    walks.forEach(walk => console.log(`Walk ID ${walk.id}: walkerId=${walk.walkerId}, status=${walk.status}, date=${walk.date}`));
    
    let earningsCreated = 0;
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
    
    // Debug: Print all walker earnings
    const allEarnings = Array.from(this.walkerEarnings.values());
    console.log(`Total walker earnings records: ${allEarnings.length}`);
    allEarnings.forEach(earning => 
      console.log(`Earning record: walkerId=${earning.walkerId}, walkId=${earning.walkId}, amount=${earning.amount}, paid=${earning.isPaid}`)
    );
    
    // For each walk, create an earning record
    for (const walk of walks) {
      // Check if an earning record already exists for this walk
      const existingEarning = Array.from(this.walkerEarnings.values()).find(
        earning => earning.walkId === walk.id
      );
      
      console.log(`Walk ID ${walk.id}: existing earning record? ${existingEarning ? 'YES' : 'NO'}`);
      
      if (!existingEarning && walk.walkerId) {
        // Calculate the earning amount
        const earningAmount = await this.calculateWalkerEarningForWalk(walk.walkerId, walk.id);
        console.log(`Walk ID ${walk.id}: calculated earning amount = ${earningAmount}`);
        
        if (earningAmount > 0) {
          // Create a new earning record
          const newEarning = await this.createWalkerEarning({
            walkerId: walk.walkerId,
            walkId: walk.id,
            amount: earningAmount.toString(),
            earnedDate: today,
            isPaid: false,
            paymentId: null
          });
          
          console.log(`Created new earning record: ${JSON.stringify(newEarning)}`);
          earningsCreated++;
        } else {
          console.log(`Skipping earnings record for Walk ID ${walk.id}: earning amount is ${earningAmount}`);
        }
      } else {
        console.log(`Skipping earnings record for Walk ID ${walk.id}: ${existingEarning ? 'earnings record already exists' : 'no walker assigned'}`);
      }
    }
    
    return earningsCreated;
  }
  
  async getUnpaidWalkerEarnings(walkerId: number): Promise<WalkerEarningWithDetails[]> {
    const allEarnings = await this.getWalkerEarnings(walkerId);
    return allEarnings.filter(earning => !earning.isPaid);
  }
  
  // Walker payment operations
  async getWalkerPayments(walkerId: number): Promise<WalkerPayment[]> {
    // First check if the provided ID is a user ID (from URL) or a walker ID (from database)
    let walker = await this.getWalker(walkerId);
    
    // If no walker was found with the direct ID, try getting walker by user ID
    if (!walker) {
      console.log(`No walker found with direct ID ${walkerId}, trying to get walker by user ID`);
      walker = await this.getWalkerByUserId(walkerId);
      if (walker) {
        console.log(`Found walker with ID ${walker.id} by user ID ${walkerId}`);
        walkerId = walker.id; // Use the correct walker ID from now on
      }
    }
    
    if (!walker) {
      console.log(`Still no walker found for ID ${walkerId}`);
      return [];
    }
    
    console.log(`Searching payments with walkerId ${walkerId}`);
    
    return Array.from(this.walkerPayments.values())
      .filter(payment => payment.walkerId === walkerId)
      .sort((a, b) => {
        // Sort by payment date in descending order (newest first)
        return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
      });
  }
  
  async createWalkerPayment(paymentData: InsertWalkerPayment): Promise<WalkerPayment> {
    const id = this.walkerPaymentIdCounter++;
    const payment: WalkerPayment = {
      ...paymentData,
      id
    };
    
    this.walkerPayments.set(id, payment);
    return payment;
  }
  
  async getWalkerPaymentDetails(paymentId: number): Promise<{payment: WalkerPayment, earnings: WalkerEarningWithDetails[]} | undefined> {
    const payment = this.walkerPayments.get(paymentId);
    if (!payment) return undefined;
    
    // Get all earnings associated with this payment
    const earnings = await this.getWalkerEarnings(payment.walkerId);
    const paymentEarnings = earnings.filter(earning => earning.paymentId === paymentId);
    
    return {
      payment,
      earnings: paymentEarnings
    };
  }
  
  async processWalkerPayment(walkerId: number, amount: number, paymentDate: string, paymentMethod: string, notes?: string): Promise<WalkerPayment> {
    // Create the payment record
    const payment = await this.createWalkerPayment({
      walkerId,
      amount: amount.toString(),
      paymentDate,
      paymentMethod,
      notes: notes || null
    });
    
    // Get unpaid earnings
    const unpaidEarnings = await this.getUnpaidWalkerEarnings(walkerId);
    let remainingAmount = amount;
    
    // Mark earnings as paid until we've covered the payment amount
    for (const earning of unpaidEarnings) {
      if (remainingAmount <= 0) break;
      
      const earningAmount = parseFloat(earning.amount);
      if (remainingAmount >= earningAmount) {
        // Mark this earning as fully paid
        await this.updateWalkerEarningStatus(earning.id, true, payment.id);
        remainingAmount -= earningAmount;
      } else {
        // This is a partial payment, we would need to split the earning
        // For simplicity, we're just marking it as fully paid for now
        await this.updateWalkerEarningStatus(earning.id, true, payment.id);
        remainingAmount = 0;
      }
    }
    
    // Update walker's total earnings and unpaid earnings
    const walker = await this.getWalker(walkerId);
    if (walker) {
      // Calculate total earnings
      const allEarnings = Array.from(this.walkerEarnings.values())
        .filter(e => e.walkerId === walkerId)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      // Calculate unpaid earnings
      const unpaidTotal = Array.from(this.walkerEarnings.values())
        .filter(e => e.walkerId === walkerId && !e.isPaid)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      // Update walker record
      await this.updateWalker(walkerId, {
        totalEarnings: allEarnings.toString(),
        unpaidEarnings: unpaidTotal.toString()
      });
    }
    
    return payment;
  }
}

export const storage = new MemStorage();
