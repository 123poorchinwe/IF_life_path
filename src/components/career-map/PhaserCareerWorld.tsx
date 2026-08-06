"use client";

import { useEffect, useRef } from "react";
import type PhaserType from "phaser";
import { withPublicBasePath } from "@/ai/dialogue-endpoint";

export type WorldPlace = {
  id: string;
  name: string;
  building: string;
  path: string;
  x: number;
  y: number;
  locked: boolean;
};

export type WorldClue = {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  collected: boolean;
};

type Props = {
  places: WorldPlace[];
  clues: WorldClue[];
  onFocus: (id: string) => void;
  onEnter: (id: string) => void;
  onInspect: (id: string) => void;
  onHint: (text: string) => void;
};

type NearbyTarget =
  | { kind: "place"; item: WorldPlace; distance: number }
  | { kind: "clue"; item: WorldClue; distance: number };

export default function PhaserCareerWorld({
  places,
  clues,
  onFocus,
  onEnter,
  onInspect,
  onHint,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onFocus, onEnter, onInspect, onHint });
  callbacks.current = { onFocus, onEnter, onInspect, onHint };

  useEffect(() => {
    if (!host.current) return;
    let game: PhaserType.Game | undefined;
    let cancelled = false;

    void import("phaser").then(({ default: Phaser }) => {
      if (cancelled || !host.current) return;
      const worldWidth = 1600;
      const worldHeight = 1000;

      class CareerTown extends Phaser.Scene {
        player!: PhaserType.Physics.Arcade.Sprite;
        cursors!: PhaserType.Types.Input.Keyboard.CursorKeys;
        keys!: Record<string, PhaserType.Input.Keyboard.Key>;
        nearby: NearbyTarget | null = null;
        lastHint = "";

        preload() {
          this.load.image(
            "career-town",
            withPublicBasePath("/assets/pixel/career-town-v1.webp"),
          );
        }

        makePerson(key: string, shirt: number, walking = false) {
          const graphic = this.make.graphics({ x: 0, y: 0 }, false);
          graphic.fillStyle(0x111a17, 0.35).fillEllipse(16, 37, 25, 7);
          graphic
            .fillStyle(0x263746)
            .fillRect(walking ? 8 : 9, 27, 6, 9)
            .fillRect(walking ? 19 : 17, 27, 6, 9);
          graphic.fillStyle(shirt).fillRect(7, 15, 20, 15);
          graphic.lineStyle(2, 0x203029).strokeRect(7, 15, 20, 15);
          graphic.fillStyle(0xd9ad87).fillRect(10, 6, 15, 11);
          graphic.fillStyle(0x252d29).fillRect(8, 2, 19, 7);
          graphic.generateTexture(key, 34, 42);
          graphic.destroy();
        }

        makeClueTexture() {
          const graphic = this.make.graphics({ x: 0, y: 0 }, false);
          graphic.fillStyle(0x20322b).fillRect(2, 6, 28, 22);
          graphic.lineStyle(2, 0xe4c66c).strokeRect(2, 6, 28, 22);
          graphic.fillStyle(0xe4c66c).fillRect(7, 2, 12, 6);
          graphic.fillStyle(0x91aaa0).fillRect(7, 12, 18, 2);
          graphic.fillStyle(0x91aaa0).fillRect(7, 18, 14, 2);
          graphic.generateTexture("evidence-folder", 32, 32);
          graphic.destroy();
        }

        create() {
          this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
          this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
          this.add
            .image(worldWidth / 2, worldHeight / 2, "career-town")
            .setDisplaySize(worldWidth, worldHeight);

          this.makePerson("player-idle", 0x739e91);
          this.makePerson("player-step", 0x88b4a6, true);
          this.makePerson("npc-blue", 0x6e879f);
          this.makePerson("npc-gold", 0xb98d55, true);
          this.makeClueTexture();

          this.player = this.physics.add
            .sprite(800, 550, "player-idle")
            .setCollideWorldBounds(true)
            .setDepth(20)
            .setBodySize(20, 22)
            .setOffset(7, 17);

          const walls = [
            [0, 0, 1600, 34],
            [0, 966, 1600, 34],
            [0, 0, 34, 1000],
            [1566, 0, 34, 1000],
            [210, 90, 260, 145],
            [1030, 80, 300, 155],
            [1080, 430, 300, 160],
            [180, 410, 250, 150],
            [590, 690, 300, 150],
          ];
          walls.forEach(([x, y, width, height]) => {
            const wall = this.add.rectangle(
              x + width / 2,
              y + height / 2,
              width,
              height,
              0,
              0,
            );
            this.physics.add.existing(wall, true);
            this.physics.add.collider(this.player, wall);
          });

          const npcRoutes = [
            [520, 360, 710, 430],
            [830, 610, 1060, 670],
            [460, 650, 600, 790],
            [980, 290, 1250, 320],
          ];
          npcRoutes.forEach((route, index) => {
            const npc = this.physics.add
              .sprite(
                route[0],
                route[1],
                index % 2 ? "npc-gold" : "npc-blue",
              )
              .setDepth(18);
            this.tweens.add({
              targets: npc,
              x: route[2],
              y: route[3],
              duration: 4500 + index * 800,
              yoyo: true,
              repeat: -1,
              ease: "Sine.inOut",
              onYoyo: () => npc.setFlipX(!npc.flipX),
              onRepeat: () => npc.setFlipX(!npc.flipX),
            });
          });

          places.forEach((place) => {
            const x = (place.x / 100) * worldWidth;
            const y = (place.y / 100) * worldHeight;
            const color = place.locked ? 0x8a615c : 0xe4c66c;
            const ring = this.add
              .circle(x, y, 34, color, 0.13)
              .setStrokeStyle(3, color, 0.8)
              .setDepth(12);
            this.tweens.add({
              targets: ring,
              scale: 1.16,
              alpha: 0.45,
              duration: 1000,
              yoyo: true,
              repeat: -1,
            });
            const label = this.add
              .text(
                x,
                y - 48,
                place.locked
                  ? `${place.name} · 当前不可进入`
                  : `${place.name} · E进入`,
                {
                  fontFamily: "sans-serif",
                  fontSize: "15px",
                  color: place.locked ? "#d3aaa6" : "#fff1ba",
                  backgroundColor: "#101a16dd",
                  padding: { x: 7, y: 4 },
                },
              )
              .setOrigin(0.5)
              .setDepth(25)
              .setInteractive({ useHandCursor: true });
            label.on("pointerdown", () => {
              callbacks.current.onFocus(place.id);
              this.physics.moveTo(this.player, x, y + 52, 210);
            });
          });

          clues
            .filter((clue) => !clue.collected)
            .forEach((clue) => {
              const x = (clue.x / 100) * worldWidth;
              const y = (clue.y / 100) * worldHeight;
              const marker = this.add
                .sprite(x, y, "evidence-folder")
                .setDepth(22)
                .setInteractive({ useHandCursor: true });
              this.tweens.add({
                targets: marker,
                y: y - 7,
                duration: 850,
                yoyo: true,
                repeat: -1,
                ease: "Sine.inOut",
              });
              marker.on("pointerdown", () =>
                this.physics.moveTo(this.player, x, y + 35, 210),
              );
              this.add
                .text(x, y - 28, "可调查线索", {
                  fontFamily: "sans-serif",
                  fontSize: "12px",
                  color: "#d9f0df",
                  backgroundColor: "#173027dd",
                  padding: { x: 5, y: 3 },
                })
                .setOrigin(0.5)
                .setDepth(23);
            });

          this.cursors = this.input.keyboard!.createCursorKeys();
          this.keys = this.input.keyboard!.addKeys(
            "W,A,S,D,E",
          ) as Record<string, PhaserType.Input.Keyboard.Key>;
          this.input.keyboard!.on("keydown-E", () => {
            if (!this.nearby) return;
            if (this.nearby.kind === "clue") {
              callbacks.current.onInspect(this.nearby.item.id);
              return;
            }
            if (this.nearby.item.locked) {
              callbacks.current.onHint("当前无法进入：查看地点面板了解原因");
              return;
            }
            callbacks.current.onEnter(this.nearby.item.id);
          });
          this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
          this.cameras.main.setZoom(0.92);
          this.cameras.main.fadeIn(350, 9, 16, 13);
        }

        update() {
          const body = this.player.body as PhaserType.Physics.Arcade.Body;
          const left = this.cursors.left.isDown || this.keys.A.isDown;
          const right = this.cursors.right.isDown || this.keys.D.isDown;
          const up = this.cursors.up.isDown || this.keys.W.isDown;
          const down = this.cursors.down.isDown || this.keys.S.isDown;
          body.setVelocity(0);
          if (left) body.setVelocityX(-190);
          if (right) body.setVelocityX(190);
          if (up) body.setVelocityY(-190);
          if (down) body.setVelocityY(190);
          body.velocity.normalize().scale(190);
          this.player
            .setFlipX(body.velocity.x < 0)
            .setTexture(
              body.speed > 0 && Math.floor(this.time.now / 170) % 2
                ? "player-step"
                : "player-idle",
            );

          const targets: NearbyTarget[] = [
            ...places.map((item) => ({
              kind: "place" as const,
              item,
              distance: Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                (item.x / 100) * worldWidth,
                (item.y / 100) * worldHeight,
              ),
            })),
            ...clues
              .filter((item) => !item.collected)
              .map((item) => ({
                kind: "clue" as const,
                item,
                distance: Phaser.Math.Distance.Between(
                  this.player.x,
                  this.player.y,
                  (item.x / 100) * worldWidth,
                  (item.y / 100) * worldHeight,
                ),
              })),
          ];
          targets.sort((a, b) => a.distance - b.distance);
          this.nearby = targets[0]?.distance < 115 ? targets[0] : null;
          const hint = this.nearby
            ? this.nearby.kind === "clue"
              ? `按 E 调查：${this.nearby.item.title}`
              : `按 E 进入：${this.nearby.item.building}`
            : "WASD / 方向键移动 · 靠近人物、地点或线索互动";
          if (hint !== this.lastHint) {
            this.lastHint = hint;
            callbacks.current.onHint(hint);
          }
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host.current!,
        backgroundColor: "#15231d",
        pixelArt: true,
        roundPixels: true,
        physics: { default: "arcade", arcade: { debug: false } },
        scale: {
          mode: Phaser.Scale.RESIZE,
          width: "100%",
          height: "100%",
        },
        scene: CareerTown,
      });
    });

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [clues, places]);

  return (
    <div
      className="phaser-world"
      ref={host}
      aria-label="可探索职业像素小镇"
    />
  );
}
