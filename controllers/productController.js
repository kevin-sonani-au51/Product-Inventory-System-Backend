const Product = require("../models/Product");
const Category = require("../models/Category");
const mongoose = require("mongoose");

exports.create = async (req, res) => {
  try {
    const { name, description, quantity, categories } = req.body;

    if (!name || !description || !quantity || !categories) {
      return res.status(400).json({ error: "Product details required" });
    }

    /* check the product availability */
    const cleanName = name.toLowerCase().replace(/\s+/g, "");
    const existing = await Product.aggregate([
      {
        $addFields: {
          name: {
            $replaceAll: {
              input: { $toLower: "$name" },
              find: " ",
              replacement: "",
            },
          },
        },
      },
      {
        $match: {
          name: cleanName,
        },
      },
    ]);

    if (existing.length > 0)
      return res.status(400).json({ error: "Product name must be unique" });

    /* seeding the categories (Start) */
    if (categories.length > 0) {
      for (let name of categories) {
        lowername = name.toLowerCase().replace(/\s+/g, "");

        const query = [
          {
            $addFields: {
              name: {
                $replaceAll: {
                  input: { $toLower: "$name" },
                  find: " ",
                  replacement: "",
                },
              },
            },
          },
          {
            $match: {
              name: lowername,
            },
          },
        ];
        const getcategories = await Category.aggregate(query);

        if (getcategories.length == 0) {
          const newcategory = new Category({
            name: name,
          });
          await newcategory.save();
        }
      }
    }

    /* seeding the categories (End) */

    /* create new product */
    const product = new Product({
      name,
      description,
      quantity,
      categories: categories,
    });

    await product.save();
    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.list = async (req, res) => {
  try {
    const reqbodody = req.body;
    const {
      page = Number(reqbodody?.page) || 1,
      limit = Number(reqbodody?.size) || 10,
      search = reqbodody?.search || "",
      categoryIds = reqbodody?.categories || [],
    } = req.query;

    const query = {};

    if (search) query.name = { $regex: search, $options: "i" };

    if (categoryIds.length > 0) {
      const ids = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
      const categoriesquery = [
        {
          $match: {
            _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) },
          },
        },
        {
          $group: {
            _id: {},
            Name: {
              $push: "$name",
            },
          },
        },
      ];

      const getcategories = await Category.aggregate(categoriesquery);

      if (getcategories.length > 0) {
        query.categories = {
          $in: getcategories[0].Name,
        };
      }
    }

    const total = await Product.countDocuments(query);

    const agg = [
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit }, // Skip documents for pagination
      { $limit: limit },
    ];

    const products = await Product.aggregate(agg);

    res.json({
      products: products.map((p) => ({
        id: p._id,
        name: p.name,
        description: p.description,
        quantity: p.quantity,
        addedOn: p.createdAt,
        categories: p.categories,
      })),
      currentPage: +page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await Product.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
