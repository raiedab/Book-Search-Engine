const { User } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      const userData = await User.findOne({ _id: context.user._id }).select('-__v -password');
      return userData;
    },
  },
  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return { user, token };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }
      const correctPassword = await user.isCorrectPassword(password);
      if (!correctPassword) {
        throw new AuthenticationError('Incorrect password');
      }
      const token = signToken(user);
      return { user, token };
    },
    saveBook: async (parent, { input }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to save a book');
      }
      const updatedUser = await User.findByIdAndUpdate(
        { _id: context.user._id },
        { $push: { savedBooks: input } },
        { new: true }
      );
      return updatedUser;
    },
    removeBook: async (parent, { bookId }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to remove a book');
      }
      const updatedUser = await User.findByIdAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );
      return updatedUser;
    },
  },
};

module.exports = resolvers;
