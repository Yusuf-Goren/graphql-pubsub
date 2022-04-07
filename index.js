const { GraphQLServer, PubSub, withFilter } = require("graphql-yoga");
const { nanoid } = require("nanoid");
const { events, users, locations, participants } = require("./data");
const typeDefs = `
  # User
  type User {
    id: ID!
    username: String!
    email: String!
    events: [Event]!
  }

  input CreateUserInput {
    username: String!
    email: String!
  }

  input UpdateUserInput {
    username: String
    email: String
  }

  type DeleteAllOutput {
    count: Int!
  }

  # Participant

  type Participant {
    id: ID!
    user_id: ID!
    event_id: ID!
  }

  input CreateParticipantInput {
    user_id: ID!
    event_id: ID!
  }

  input UpdateParticipantInput {
    user_id: ID
    event_id: ID
  }

  # Location

  type Location {
    id: ID!
    name: String!
    desc: String!
    lat: Float!
    lng: Float!
    event_id: ID!
  }

  input CreateLocationInput {
    name: String!
    desc: String!
    lat: Float!
    lng: Float!
    event_id: ID!
  }

  input UpdateLocationInput {
    name: String
    desc: String
    lat: Float
    lng: Float
    event_id: ID
  }
  # Event

  type Event {
    id: ID!
    title: String!
    desc: String!
    date: String!
    from: String!
    to: String!

    user_id: ID!
    user: User!

    location: Location!
    location_id: ID!

    participant: [Participant!]!
  }

  input addEventInput {
    title: String!
    desc: String!
    date: String!
    from: String!
    to: String!
    location_id: ID!
    user_id: ID!
  }

  input UpdateEventInput {
    title: String
    desc: String
    date: String
    from: String
    to: String
    location_id: ID
    user_id: ID
  }

  type Query {
    users: [User!]!
    user(id: ID!): User!

    events: [Event!]!
    event(id: ID!): Event!

    locations: [Location!]!
    location(id: ID!): Location!

    participants: [Participant!]!
    participant(id: ID!): Participant!
  }

  type Mutation {
    # User
    createUser(data: CreateUserInput): User!
    updateUser(id: ID!, data: UpdateUserInput): User!
    deleteUser(id: ID!): User
    deleteAllUsers: DeleteAllOutput!

    # Participant
    createParticipant(data: CreateParticipantInput): Participant!
    updateParticipant(id: ID!, data: UpdateParticipantInput): Participant!
    deleteParticipant(id: ID!): Participant!
    deleteAllParticipants: DeleteAllOutput!

    # Location
    createLocation(data: CreateLocationInput): Location!
    updateLocation(id: ID!, data: UpdateLocationInput): Location!
    deleteLocation(id: ID!): Location!
    deleteAllLocations: DeleteAllOutput!
    
    # Event
    addEvent(data: addEventInput!): Event!
    updateEvent(id: ID!, data: UpdateEventInput): Event!
    deleteEvent(id: ID!): Event!
    deleteAllEvents: DeleteAllOutput!
  }

  type Subscription {
    #User
    userCreated(id: ID): User!
    userUpdated: User!
    userDeleted: User!

    locationCreated(name: String): Location!
    locationUpdated: Location!
    locationDeleted: Location!

    eventCreated(id: ID): Event!
    eventUpdated: Event!
    eventDeleted: Event!

    participantCreated(id: ID): Participant!
    participantUpdated: Participant!
    participantDeleted: Participant!
  }
`;

const resolvers = {
  Subscription: {
    // User
    userCreated: {
      subscribe: withFilter(
        (_, __, { pubsub }) => pubsub.asyncIterator("userCreated"),
        (payload, variables) => {
          return variables.id ? payload.id === variables.id : true;
        }
      ),
    },
    userUpdated: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator("userUpadated"),
    },
    userDeleted: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator("userDeleted"),
    },
    //Location
    locationCreated: {
      subscribe: withFilter(
        (_, __, { pubsub }) => pubsub.asyncIterator("locationCreated"),
        (payload, variables) => {
          return variables.name ? payload.name === variables.name : true;
        }
      ),
    },
    locationUpdated: {
      subscribe: (_, __, { pubsub }) =>
        pubsub.asyncIterator("locationUpadated"),
    },
    locationDeleted: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator("locationDeleted"),
    },
    //Event
    eventCreated: {
      subscribe: withFilter(
        (_, __, { pubsub }) => pubsub.asyncIterator("eventCreated"),
        (payload, variables) => {
          return variables.id ? payload.id === variables.id : true;
        }
      ),
    },
    eventUpdated: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator("eventUpadated"),
    },
    eventDeleted: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator("eventDeleted"),
    },
    //Participant
    participantCreated: {
      subscribe: withFilter(
        (_, __, { pubsub }) => pubsub.asyncIterator("participantCreated"),
        (payload, variables) => {
          return variables.id ? payload.id === variables.id : true;
        }
      ),
    },
    participantUpdated: {
      subscribe: (_, __, { pubsub }) =>
        pubsub.asyncIterator("participantUpadated"),
    },
    participantDeleted: {
      subscribe: (_, __, { pubsub }) =>
        pubsub.asyncIterator("participantDeleted"),
    },
  },
  Mutation: {
    // User
    createUser: (_, { data: { username, email } }, { pubsub }) => {
      const user = {
        id: nanoid(),
        username,
        email,
      };
      users.push(user);
      pubsub.publish("userCreated", { userCreated: user });
      return user;
    },
    updateUser: (_, { id, data }) => {
      const user_index = users.findIndex((user) => user.id == id);
      if (user_index === -1) {
        throw new Error("User not found.");
      }
      const updated_user = (users[user_index] = {
        ...users[user_index],
        ...data,
      });
      pubsub.publish("userUpdated", { userUpdated: updated_user });
      return updated_user;
    },
    deleteUser: (_, { id }) => {
      const user_index = users.findIndex((user) => user.id == id);
      if (!user_index) {
        throw new Error("There is no user");
      }
      const deleted_user = users[user_index];
      users.splice(user_index, 1);
      pubsub.publish("userDeleted", { userDeleted: deleted_user });
      return deleted_user;
    },
    deleteAllUsers: () => {
      const length = users.length;
      users.splice(0, length);
      return {
        count: length,
      };
    },

    // Participant
    createParticipant: (_, { data: { user_id, event_id } }, { pubsub }) => {
      const participant = {
        id: nanoid(),
        user_id,
        event_id,
      };
      participants.push(participant);
      pubsub.publish("participantCreated", {
        participantCreated: participant,
      });
      return participant;
    },
    updateParticipant: (_, { id, data }, { pubsub }) => {
      const participant_index = participants.findIndex(
        (participant) => participant.id == id
      );
      if (participant_index === -1) {
        throw new Error("participant not found.");
      }
      const updated_participant = (participants[participant_index] = {
        ...participants[participant_index],
        ...data,
      });
      pubsub.publish("participantUpdated", {
        participantUpdated: updated_participant,
      });
      return updated_participant;
    },
    deleteParticipant: (_, { id }, { pubsub }) => {
      const participant_index = participants.findIndex(
        (participant) => participant.id == id
      );
      if (!participant_index) {
        throw new Error("There is no participant");
      }
      const deleted_participant = participants[participant_index];
      participants.splice(participant_index, 1);
      pubsub.publish("participantDeleted", {
        participantDeleted: deleted_participant,
      });
      return deleted_participant;
    },
    deleteAllParticipants: () => {
      const length = participants.length;
      participants.splice(0, length);
      return {
        count: length,
      };
    },
    // Location
    createLocation: (
      _,
      { data: { title, desc, date, from, to, location_id, user_id } },
      { pubsub }
    ) => {
      const location = {
        id: nanoid(),
        title,
        desc,
        date,
        from,
        to,
        location_id,
        user_id,
      };
      users.push(location);
      pubsub.publish("locationCreated", {
        locationCreated: location,
      });
      return location;
    },
    updateLocation: (_, { id, data }, { pubsub }) => {
      const location_index = locations.findIndex(
        (location) => location.id == id
      );
      if (location_index === -1) {
        throw new Error("location not found.");
      }
      const updated_location = (locations[location_index] = {
        ...locations[location_index],
        ...data,
      });
      pubsub.publish("locationUpadated", {
        locationUpadated: updated_location,
      });
      return updated_location;
    },
    deleteLocation: (_, { id }, { pubsub }) => {
      const location_index = locations.findIndex(
        (location) => location.id == id
      );
      if (!location_index) {
        throw new Error("There is no location");
      }
      const deleted_location = locations[location_index];
      locations.splice(location_index, 1);
      pubsub.publish("locationDeleted", {
        locationDeleted: deleted_location,
      });
      return deleted_location;
    },
    deleteAllLocations: () => {
      const length = locations.length;
      locations.splice(0, length);
      return {
        count: length,
      };
    },
    // Event
    addEvent: (_, { data }, { pubsub }) => {
      const event = {
        id: nanoid(),
        ...data,
      };

      events.push(event);
      pubsub.publish("eventCreated", {
        eventCreated: event,
      });
      return event;
    },
    updateEvent: (_, { id, data }, { pubsub }) => {
      const event_index = events.findIndex((event) => event.id == id);
      if (event_index === -1) {
        throw new Error("event not found.");
      }
      const updated_event = (events[event_index] = {
        ...events[event_index],
        ...data,
      });
      pubsub.publish("eventUpdated", {
        eventUpdated: updated_event,
      });
      return updated_event;
    },
    deleteEvent: (_, { id }, { pubsub }) => {
      const event_index = events.findIndex((event) => event.id == id);
      if (!event_index) {
        throw new Error("There is no event");
      }
      const deleted_event = events[event_index];
      events.splice(event_index, 1);
      pubsub.publish("eventDeleted", {
        eventDeleted: deleted_event,
      });
      return deleted_event;
    },
    deleteAllEvents: () => {
      const length = events.length;
      events.splice(0, length);
      return {
        count: length,
      };
    },
  },

  Query: {
    // Users
    users: () => users,
    user: (parents, args) => users.find((user) => user.id == args.id),
    // Events
    events: () => events,
    event: (parents, args) => events.find((event) => event.id == args.id),

    // Locations
    locations: () => locations,
    location: (parents, args) =>
      locations.find((location) => location.id == args.id),
    // Participant
    participants: () => participants,
    participant: (parents, args) =>
      participants.find((participant) => participant.id == args.id),
  },

  User: {
    events: (parents, args) =>
      events.filter((event) => event.user_id == parents.id),
  },
  Event: {
    user: (parents, args) => users.find((user) => user.id == parents.user_id),
    location: (parents, args) =>
      locations.find((location) => location.id == parents.location_id),
    participant: (parents, args) =>
      participants.filter((participant) => participant.event_id == parents.id),
  },
};

const pubsub = new PubSub();
const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: {
    pubsub,
  },
});

server.start(() => console.log("Server is running on localhost:4000"));
