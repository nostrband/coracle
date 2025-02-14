import {Tags} from "paravel"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {addTopic, processTopics} from "./commands"

projections.addHandler(1, processTopics)

projections.addHandler(1985, (e: Event) => {
  for (const name of Tags.from(e).type("l").mark("#t").values().all()) {
    addTopic(e, name)
  }
})
