# dependencies
from grpc.experimental import aio
# module
import chromosomeregion_pb2
import chromosomeregion_pb2_grpc


class ChromosomeRegion(chromosomeregion_pb2_grpc.ChromosomeRegionServicer):

  def __init__(self, handler):
    self.handler = handler

  async def GetRegion(self, request, context):
    region = await self.handler.process(request.chromosome, request.start, request.stop)
    return chromosomeregion_pb2.RegionReply(gene=region['gene'], neighbors=region['neighbors'])


async def run_grpc_server(host, port, handler):
  server = aio.server()
  server.add_insecure_port(f'{host}:{port}')
  servicer = ChromosomeRegion(handler)
  chromosomeregion_pb2_grpc.add_ChromosomeRegionServicer_to_server(servicer, server)
  await server.start()
  await server.wait_for_termination()
