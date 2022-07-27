const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

const colors = require("colors");
require("dotenv").config();

let prefix = ">";

let giveawayInProgress = false;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

// Function Definitions

const updateTime = (timeInSeconds) => {
  const secondsInDays = Math.floor((timeInSeconds % (86400 * 30)) / 86400);
  const secondsInHours = Math.floor((timeInSeconds % 86400) / 3600);
  const secondsInMins = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);

  return [secondsInDays, secondsInHours, secondsInMins, seconds];
};

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith(prefix)) {
    const [command, ...args] = message.content
      .slice(prefix.length)
      .split(/\s+/);

    if (command === "giveaway") {
      if (args[0] === "create") {
        function commandError(title, description) {
          const errorEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor("Red");
          return message.channel.send({ embeds: [errorEmbed] });
        }

        if (giveawayInProgress) {
          return commandError(
            "Error!",
            "You cannot create multiple giveaways!"
          );
        }
        let [_, d, h, m, s, ...details] = args;

        // Checking if all the inputs are numbers
        if (isNaN(d) || isNaN(h) || isNaN(m) || isNaN(s))
          return await message.channel.send(
            "Invalid inputs : " +
              (isNaN(d) ? "d, " : "") +
              (isNaN(h) ? "hours, " : "") +
              (isNaN(m) ? "mins, " : "") +
              (isNaN(s) ? "secs" : "")
          );

        // Checking if all the time inputs are not 0
        if (d == 0 && h == 0 && m == 0 && s == 0)
          return commandError(
            "Duration Error!",
            "All the values cannot be 0\nYou can use the `>giveaway help` to see how to set up a giveaway!"
          );

        // Checking if the total time inputs are less than 60 seconds
        if (d == 0 && h == 0 && m == 0 && s <= 60)
          return commandError(
            "Duration Error!",
            "The minimum duration of a giveaway should be 5 min!\nYou entered a duration which is less than 60 seconds!\nYou can use the `>giveaway help` to see how to set up a giveaway!"
          );

        // Checking if the total time inputs are more 5 minutes
        if (d == 0 && h == 0 && m <= 5)
          return commandError(
            "Duration Error!",
            "The minimum duration of a giveaway should be 5 min!\nYou entered a duration which is less than 5 mins\nYou can use the `>giveaway help` to see how to set up a giveaway!"
          );

        // Checking if days are not more than 7
        if (d >= 8)
          return commandError(
            "Day input Error!",
            "The day input ranges only from 0-7!\n Please enter a number in that range!\nYou can use the `>giveaway help` to see how to set up a giveaway!"
          );

        // Checking if hours are not more than 24
        if (h >= 25)
          return commandError(
            "Hour input Error!",
            "The hour input ranges only from 0-24!\n Please enter a number in that range!\nYou can use the `>giveaway help` to see how to set up a giveaway!"
          );

        // Checking if minutes are not more than 60
        if (m > 60)
          return commandError(
            "Minutes input Error!",
            "The minutes input ranges only from 0-60!\n Please enter a number in that range!\nYou can use the `>giveaway help` to see how to set up a giveaway!"
          );

        // Checking if seconds are not more than 60
        if (s > 60)
          return commandError(
            "Seconds input Error!",
            "The seconds input ranges only from 0-60!\n Please enter a number in that range!\nYou can use the `>giveaway help` to see how to set up a giveaway!"
          );

        // Checking if details of the giveaway is given!
        if (details.length === 0)
          return commandError(
            "Giveaway Details input Error!",
            "The details of the giveaway has not been mentioned!\nPlease use the `title:` and `:desc` to enter the details of the giveaway\nYou can use the `>giveaway help` to see how to set up a giveaway!"
          );

        // Checking if the title of the details is given first
        if (args[5] !== "title:")
          return commandError(
            "Giveaway Details input Error!",
            "The details of the giveaway are not following the syntax!\nPlease use the `title:` first and then `:desc` to enter the details of the giveaway\nYou can use the `>giveaway help` to see how to set up a giveaway!"
          );

        let giveawayDetails = details.join(" ");

        // Checking if title and description attributes are given
        if (
          !giveawayDetails.includes("title:") &&
          !giveawayDetails.includes("desc:")
        )
          return commandError(
            "Giveaway Details input Error!",
            "The details doesn't contain `title:` & `desc:` in the details section\nYou can use the `>giveaway help` to see how to set up a giveaway!"
          );

        //checking if description attribute is given
        if (
          giveawayDetails.includes("title:") &&
          !giveawayDetails.includes("desc:")
        )
          return commandError(
            "Giveaway Details input Error!",
            "`desc:` attribute isn't been specificed!"
          );
        const [gaTitle, gaDesc] = giveawayDetails
          .split("title:")[1]
          .split("desc:");

        let totalTimeInSeconds = 3;
        // Number(d) * 86400 + Number(h) * 3600 + Number(m) * 60 + Number(s);

        let [secondsInDays, secondsInHours, secondsInMins, seconds] =
          updateTime(totalTimeInSeconds);

        const timeEmbed = new EmbedBuilder()
          .setAuthor({
            name: message.guild.name,
            iconURL: message.guild.iconURL(),
          })
          .setTitle(gaTitle)
          .setDescription(gaDesc)
          .setThumbnail(message.guild.iconURL())
          .setColor("Purple")
          .setFields([
            { name: "\u200B", value: "\u200B" },
            {
              inline: false,
              name: "```Time Left```",
              value: `\u200B`,
            },
            { inline: true, name: "**Days**", value: `${secondsInDays}` },
            { inline: true, name: "**Hours**", value: `${secondsInHours}` },
            { inline: true, name: "**Minutes**", value: `${secondsInMins}` },
            { inline: true, name: "**Seconds**", value: `${seconds}` },
          ]);

        giveawayInProgress = !giveawayInProgress;

        let msg = await message.channel.send({ embeds: [timeEmbed] });
        msg.react("🎈");

        let userSelected = [];
        const filter = (reaction, user) => {
          return reaction.emoji.name === "🎈";
        };

        const collector = msg.createReactionCollector({
          filter,
          time: totalTimeInSeconds * 1000,
        });
        collector.on("collect", (reaction, user) => {
          if (user.id !== msg.author.id) userSelected.push(user.id);
        });

        const timerStart = setInterval(() => {
          totalTimeInSeconds -= 1;
          let [updatedDays, updatedHours, updatedMins, updatedSeconds] =
            updateTime(totalTimeInSeconds);
          const editEmbed = new EmbedBuilder()
            .setAuthor({
              name: message.guild.name,
              iconURL: message.guild.iconURL(),
            })
            .setTitle(gaTitle)
            .setDescription(gaDesc)
            .setThumbnail(message.guild.iconURL())
            .setColor("Purple")
            .setFields([
              { name: "\u200B", value: "\u200B" },
              {
                inline: false,
                name: "```Time Left```",
                value: `\u200B`,
              },
              { inline: true, name: "**Days**", value: `${updatedDays}` },
              { inline: true, name: "**Hours**", value: `${updatedHours}` },
              { inline: true, name: "**Minutes**", value: `${updatedMins}` },
              { inline: true, name: "**Seconds**", value: `${updatedSeconds}` },
            ]);

          msg.edit({ embeds: [editEmbed] });

          if (totalTimeInSeconds <= 0) {
            giveawayInProgress = false;
            const usersEntered = userSelected.length;
            clearInterval(timerStart);
            if (!usersEntered) {
              const endEmbed = new EmbedBuilder()
                .setAuthor({
                  name: message.guild.name,
                  iconURL: message.guild.iconURL(),
                })
                .setTitle("Content Results!")
                .setDescription(
                  "None of the users from the server entered the giveaway!"
                )
                .setColor("Green")
                .setThumbnail(message.guild.iconURL())
                .setTimestamp()
                .setFields([
                  { name: "\u200B", value: "\u200B" },
                  { name: "Event", value: gaTitle },
                ]);
              msg.reactions.removeAll();
              msg.react("😞");
              return msg.edit({ embeds: [endEmbed] });
            }

            const randomNum = Math.floor(Math.random() * usersEntered);
            const winner = client.users.cache.get(userSelected[randomNum]);

            const winnerEmbed = new EmbedBuilder()
              .setAuthor({
                name: message.guild.name,
                iconURL: message.guild.iconURL(),
              })
              .setTitle("Content Results!")
              .setDescription(
                ` Congratulations <@${userSelected[randomNum]}>! You won the giveaway! DM the event host to claim your reward! `
              )
              .setColor("Green")
              .setThumbnail(winner.avatarURL())
              .setTimestamp()
              .setFields([
                { name: "\u200B", value: "\u200B" },
                { name: "Event", value: gaTitle },
              ]);
            msg.edit({ embeds: [winnerEmbed] });
            msg.reactions.removeAll();
            msg.react("🥳");
            return winner.send({ embeds: [winnerEmbed] });
          }
        }, 1000);
      }
    }
  }
});

client.once("ready", (client) =>
  console.log(
    `${client.user.tag}`.bgMagenta + " is logged and ready to go!".cyan
  )
);

client.login(process.env.GIVEAWAY_BOT_TOKEN);
