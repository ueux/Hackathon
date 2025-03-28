import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    await user.save({ validateBeforeSave: false });

    return { accessToken};
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const createUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (
    [ email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }
  const user = await User.create({
    email,
    password,
    username:username.toLowerCase(),
  });
  const { accessToken} = await generateAccessToken(
    user._id
  );
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: 'strict',
    maxAge:30*24*60*60*1000
  };
  const createdUser = await User.findById(user._id).select("-password");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200,  {
      user: createdUser,
      accessToken,

    }, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  if (!password) {
    throw new ApiError(400, "pasword is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken} = await generateAccessToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password "
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    expires:new Date(0),
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
  return res
    .status(200)
    .json(new ApiResponse(200, {users}, "All Users"));
})

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.find(req.user._id)
  return res
    .status(200)
    .json(new ApiResponse(200, {user}, "All Users"));
})

const updateUserData = asyncHandler(async (req, res) => {
  const { username, email } = req.body;
  // if (!username || !email) {
  //   throw new ApiError(400, "All fields are required");
  // }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        email: email,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, {user}, "Account details updated successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, confirmPassword, newPassword } = req.body;
  if (confirmPassword !== newPassword) {
    throw new ApiError(400, "Confirm Password does not match");
  }
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  const updatedUser=await User.findById(user._id).select(
    "-password "
  );
  return res
    .status(200)
    .json(new ApiResponse(200, {user:updatedUser}, "Password changed successfully"));
});

const deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    if (user.isAdmin) throw new ApiError(400, "Cannot delete admin");
    await User.deleteOne({ _id: user._id })
    res.json(new ApiResponse(200,{},"User removed"))
  }
  else  throw new ApiError(400, "user not found");
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (user) {

    res.status(200).json(new ApiResponse(200, {user},"This User"))
  }
  else  throw new ApiError(400, "user not found");
});

const updateUserById = asyncHandler(async (req, res) => {
  const { username,isAdmin, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username,
        email: email,
        isAdmin
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});


export { createUser,updateUserById,getUserById,loginUser,deleteUserById ,logoutUser,updateUserData,changeCurrentPassword ,getUserProfile,getAllUsers};
