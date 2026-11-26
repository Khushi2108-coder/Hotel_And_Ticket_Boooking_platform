import User from "../models/User.js";

/**
 * UserRepository – MongoDB Atlas ONLY. No JSON fallback.
 */
export class UserRepository {
  async findById(id, { includePassword = false, select = "" } = {}) {
    if (!id) return null;

    let query;
    if (/^[0-9a-fA-F]{24}$/.test(String(id))) {
      query = User.findById(id);
    } else {
      query = User.findOne({ legacyId: String(id) });
    }
    if (includePassword) query.select("+password");
    if (select) query.select(select);

    const user = await query.exec();
    if (!user) return null;
    const obj = user.toObject ? user.toObject() : user;
    obj.id = obj._id?.toString() || obj.legacyId || String(id);
    return obj;
  }

  async findByEmail(email, { includePassword = false, select = "" } = {}) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    const query = User.findOne({ email: cleanEmail });
    if (includePassword) query.select("+password");
    if (select) query.select(select);
    const user = await query.exec();
    if (!user) return null;
    const obj = user.toObject ? user.toObject() : user;
    obj.id = obj._id?.toString();
    return obj;
  }

  async findByUsername(username, { includePassword = false, select = "" } = {}) {
    if (!username) return null;
    const cleanUsername = username.toLowerCase().trim();
    const query = User.findOne({ username: cleanUsername });
    if (includePassword) query.select("+password");
    if (select) query.select(select);
    const user = await query.exec();
    if (!user) return null;
    const obj = user.toObject ? user.toObject() : user;
    obj.id = obj._id?.toString();
    return obj;
  }

  async findOne(predicateOrFilter, { includePassword = false, select = "" } = {}) {
    if (typeof predicateOrFilter === "function") {
      const q = User.find();
      if (includePassword) q.select("+password");
      if (select) q.select(select);
      const users = await q.lean();
      const found = users.find(predicateOrFilter) || null;
      if (found) found.id = found._id?.toString();
      return found;
    }
    const q = User.findOne(predicateOrFilter);
    if (includePassword) q.select("+password");
    if (select) q.select(select);
    const user = await q.lean();
    if (user) user.id = user._id?.toString();
    return user;
  }

  async find(filterOrPredicate) {
    if (typeof filterOrPredicate === "function") {
      const users = await User.find().lean();
      return users.map((u) => ({ ...u, id: u._id?.toString() })).filter(filterOrPredicate);
    }
    const users = await User.find(filterOrPredicate || {}).lean();
    return users.map((u) => ({ ...u, id: u._id?.toString() }));
  }

  async create(userData) {
    const user = new User(userData);
    await user.save();
    const obj = user.toObject();
    obj.id = obj._id.toString();
    delete obj.password;
    return obj;
  }

  async updateById(id, updateData) {
    let filter = /^[0-9a-fA-F]{24}$/.test(String(id))
      ? { _id: id }
      : { legacyId: String(id) };
    const user = await User.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
    if (!user) return null;
    user.id = user._id.toString();
    delete user.password;
    return user;
  }

  async count(filter = {}) {
    return User.countDocuments(filter);
  }
}

export const userRepository = new UserRepository();
export default userRepository;
