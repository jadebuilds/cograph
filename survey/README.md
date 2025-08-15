# survey: A "good enough" AI conversational agent for viral surveys

## Context: Jade needs co-founders

I'm trying to find co-founders for Root Systems Cooperative.

This is an attempt at a simple AI agent which can submit user responses
to a database.

I'm using a "tiered risk" structure to try out a few different means of 
surveying people so that I can dogfood the survey tool in my own life
and not worry too much about completely bodging a user interaction.

The tiers are roughly as follows:

1. Regular survey (user-defined questions, user-defined schema)
2. Conversational survey (AI conversational agent, user-defined schema)
3. Conversational exploration (AI conversational agent, agent-suggested schemas)


## Implementation

I intend to use a simple custom Python framework which allows executing a
directed graph (cyclic hopefully OK with cycle counting of some sort) of prompts
against a local LLM.

# Etymological caveat

The etymology of survey is "oversee." Post-capitalist systems can use data,
but we can't worship data like the Taylorites who built the modern corporation.

That's why exploration needs to become the goal -- the users (by way of LLM)
are able to submit data that we didn't realize we needed -- hence agent-suggested
schema as the goal.
