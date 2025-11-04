const CountingVote = AsynHandler(async (req, res) => {
  const { EventID } = req.body;

  if (!EventID) {
    throw new ApiError(401, "EventID is required!");
  }

  const eventObjectId = new mongoose.Types.ObjectId(EventID);

  const voteCounts = await VoteCount.aggregate([
    {
      $match: {
        EventID: eventObjectId,
        ElectionType: { $in: ["Single", "MultiVote"] }
      }
    },
    { $unwind: "$SelectedNominee" },
    {
      $group: {
        _id: "$SelectedNominee.NomineeId",
        TotalVote: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        NomineeID: "$_id",
        TotalVote: 1
      }
    },
    { $sort: { TotalVote: -1 } }
  ]);

  const rankCounts = await VoteCount.aggregate([
    {
      $match: {
        EventID: eventObjectId,
        ElectionType: "Rank"
      }
    },
    { $unwind: "$SelectedNominee" },
    {
      $group: {
        _id: "$SelectedNominee.NomineeId",
        TotalRank: { $sum: "$SelectedNominee.Rank" }
      }
    },
    {
      $project: {
        _id: 0,
        NomineeID: "$_id",
        TotalRank: 1
      }
    },
    { $sort: { TotalRank: 1 } } // Lower rank = higher preference
  ]);

  console.log("Counting vote successfully");
  return res.status(200).json(
    new ApiResponse(200, {
      SingleAndMultiVoteResults: voteCounts,
      RankVoteResults: rankCounts
    }, "Vote counting completed")
  );
});
