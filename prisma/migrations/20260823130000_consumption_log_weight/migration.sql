-- Consumo parziale anche a peso/volume (es. "300 g" da "2 kg"), oltre a
-- quello a unità già esistente ("1 scatola" da "5 scatole"): amount deve
-- poter essere decimale, e serve sapere quale dei due tipi è una riga.

-- CreateEnum
CREATE TYPE "ConsumptionKind" AS ENUM ('COUNTABLE', 'WEIGHT');

-- AlterTable
ALTER TABLE "ConsumptionLog" ADD COLUMN "kind" "ConsumptionKind" NOT NULL DEFAULT 'COUNTABLE';
ALTER TABLE "ConsumptionLog" ALTER COLUMN "amount" TYPE DOUBLE PRECISION;
