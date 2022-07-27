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
        if (giveawayInProgress) {
          return message.author.send("you cant create more than one event");
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
          return message.channel.send("All the values cannot be 0");

        // Checking if the total time inputs are less than 60 seconds
        if (d == 0 && h == 0 && m == 0 && s <= 60)
          return message.channel.send(
            "Enter a time which is greater than 5 mins! 1 min is not acceptable!"
          );

        // Checking if the total time inputs are more 5 minutes
        if (d == 0 && h == 0 && m <= 5)
          return message.channel.send(
            "Enter a time which is greater than 5 mins!"
          );

        // Checking if hours are not more than 24
        if (d >= 8)
          return message.channel.send("You can only enter days until 7!");

        // Checking if hours are not more than 24
        if (h >= 25)
          return message.channel.send("You can only enter hours until 24!");

        // Checking if minutes are not more than 60
        if (m > 60)
          return message.channel.send(
            "You can only enter minutes less than 60!"
          );

        // Checking if seconds are not more than 60
        if (s > 60)
          return message.channel.send("You can only enter secs less than 60!");

        // Checking if details of the giveaway is given!
        if (details.length === 0)
          return message.channel.send(
            "Please enter the details of what the giveaway is about!"
          );

        // Checking if the title of the details is given first
        if (args[5] !== "title:")
          return message.channel.send(
            "`title:` should come after the `seconds` attribute"
          );

        let giveawayDetails = details.join(" ");

        // Checking if title and description attributes are given
        if (
          !giveawayDetails.includes("title:") &&
          !giveawayDetails.includes("desc:")
        )
          return message.channel.send(
            "The details doesn't contain `title:` & `desc:` in the details section"
          );

        //checking if description attribute is given
        if (
          giveawayDetails.includes("title:") &&
          !giveawayDetails.includes("desc:")
        )
          return message.channel.send("`desc:` hasnt been specificed!");
        const [gaTitle, gaDesc] = giveawayDetails
          .split("title:")[1]
          .split("desc:");

        let totalTimeInSeconds = 10;
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
            if (!usersEntered) return msg.edit("nobody entered");

            const randomNum = Math.floor(Math.random() * usersEntered);

            return msg.edit(`<@${userSelected[randomNum]}> won `);
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
