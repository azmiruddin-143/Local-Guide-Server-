import { Query } from 'mongoose';
import { excludeField } from '../constants';

export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  filter(): this {
    const filter = { ...this.query };

    // Remove excluded fields
    for (const field of excludeField) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete filter[field];
    }

    // Build MongoDB query object
    const queryObj: any = {};

    // Handle range filters
    const minPrice = filter.minPrice;
    const maxPrice = filter.maxPrice;
    const minGroupSize = filter.minGroupSize;
    const maxGroupSize = filter.maxGroupSize;
    const duration = filter.duration;

    // Price range filter
    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
      delete filter.minPrice;
      delete filter.maxPrice;
    }

    // Group size range filter
    if (minGroupSize || maxGroupSize) {
      queryObj.maxGroupSize = {};
      if (minGroupSize) queryObj.maxGroupSize.$gte = Number(minGroupSize);
      if (maxGroupSize) queryObj.maxGroupSize.$lte = Number(maxGroupSize);
      delete filter.minGroupSize;
      delete filter.maxGroupSize;
    }

    // Duration filter (exact match or less than)
    if (duration) {
      queryObj.durationMins = { $lte: Number(duration) };
      delete filter.duration;
    }

    // Languages array filter (must include at least one of the specified languages)
    if (filter.languages) {
      const langs = Array.isArray(filter.languages) 
        ? filter.languages 
        : filter.languages.split(',');
      queryObj.languages = { $in: langs };
      delete filter.languages;
    }

    // Category array filter (for multi-select)
    if (filter.category) {
      const categories = Array.isArray(filter.category)
        ? filter.category
        : filter.category.split(',');
      queryObj.category = { $in: categories };
      delete filter.category;
    }

    // Add remaining filters (exact match)
    Object.keys(filter).forEach(key => {
      if (filter[key]) {
        queryObj[key] = filter[key];
      }
    });

    this.modelQuery = this.modelQuery.find(queryObj);

    return this;
  }

  search(searchableField: string[]): this {
    const searchTerm = this.query.searchTerm || '';
    
    // Only apply search if searchTerm exists
    if (searchTerm) {
      const searchQuery = {
        $or: searchableField.map(field => ({
          [field]: { $regex: searchTerm, $options: 'i' },
        })),
      };
      this.modelQuery = this.modelQuery.find(searchQuery);
    }
    
    return this;
  }

  sort(): this {
    const sort = this.query.sort || '-createdAt';

    this.modelQuery = this.modelQuery.sort(sort);

    return this;
  }
  fields(): this {
    const fields = this.query.fields?.split(',').join(' ') || '';
    

    this.modelQuery = this.modelQuery.select(fields);

    return this;
  }

  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 8;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  build() {
    return this.modelQuery;
  }

  async getMeta() {
    // find() এ যে filter/search apply হয়েছে সেটা নিলাম
    const filter = this.modelQuery.getFilter();

    // শুধু filter/search এর উপর ভিত্তি করে count করব
    const totalDocuments = await this.modelQuery.model.countDocuments(filter);

    // pagination info
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 8;

    const totalPage = Math.ceil(totalDocuments / limit);

    return { page, limit, total: totalDocuments, totalPage };
  }
}
