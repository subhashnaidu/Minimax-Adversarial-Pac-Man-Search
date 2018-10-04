/*
 * University of Central Florida
 * CAP4630 - Fall 2018
 * Authors: Brandon Barkes and Subhash Naidu
 */

import java.awt.Point;
import java.util.ArrayList;
import java.util.List;
import pacsim.*;

//import statements

public class PacSimMinimax implements PacAction {

      //optional: class and instance variables

      public final int[] moveX = {0, 1, 0, -1};
      public final int[] moveY = {1, 0, -1, 0};
      public static int d;

      final class Position {

            Point pacPos;
            List<Point> ghostPos;

      }

      public PacSimMinimax( int depth, String fname, int te, int gran, int max )
      {
            PacSim sim = new PacSim( fname, te, gran, max );
            d = depth;
            sim.init(this);
      }

      public static void main( String[] args) {
            
            String fname = args[0];
            int depth = Integer.parseInt(args[ 1 ]);
            d = depth;

            int te = 0;
            int gr = 0;
            int ml = 0;

            if (args.length == 5) {
                  te = Integer.parseInt(args[2]);
                  gr = Integer.parseInt(args[3]);
                  ml = Integer.parseInt(args[4]);
            }

            new PacSimMinimax( depth, fname, te, gr, ml );

            System.out.println("\nAdversarial Search using Minimax by Brandon Barkes and Subhash Naidu:");

            System.out.println("\n Game board   : " + fname);

            System.out.println("    Search depth : " + depth + "\n");

            if ( te > 0 ) {
                  System.out.println("    Preliminary runs : " + te 
                  + "\n Granularity       : " + gr
                  + "\n Max move limit    : " + ml
                  + "\n\nPerliminary run results :\n");
            }
      }

      public PacFace Minimax( PacCell[][] grid ) {

            Point pacLoc;
            Position optimal;
            List<Position> PosList = new ArrayList<Position>();
            List<Point> pacList;
            List<Point> currentGhosts;
            List<List<Point>> ghostList;
            int de = d;

            pacLoc = PacUtils.findPacman( grid ).getLoc();
            currentGhosts = PacUtils.findGhosts( grid );
            pacList = new ArrayList<Point>();

            ghostList = new ArrayList<>();

            //generate list of all possible ghost Position after d turns
            for ( int i = 0; i < currentGhosts.size(); i++ ) {

                  System.out.println( currentGhosts.size() );
                  ghostList.add( allPossibleMovesStart( currentGhosts.get(i), grid, de ) );

            }

            //generate list of all potential pacman Position after d turns
            pacList = allPossibleMovesStart( pacLoc, grid, de );

            //System.out.println( ghostList.size() );

            //generate combinations of all pacman and ghost Position
            for ( int i = 0; i < pacList.size(); i++ ) {
                  
                  for ( int j = 0; j < ghostList.size(); j++ ) {

                        Position pos = new Position();
                        pos.ghostPos = new ArrayList<Point>();
                        pos.pacPos = pacList.get(i);

                        for ( int k = 0; k < ghostList.get(j).size(); k++ ) {

                              System.out.println( ghostList.get(j).get(k) );
                              pos.ghostPos.add( ghostList.get(j).get(k) );
                        }

                        PosList.add( pos );
                  }
            }

            for ( int i = 0; i < PosList.size(); i++ ) {

                  // System.out.println( PosList.get(i).pacPos );
                  // System.out.println( PosList.get(i).ghostPos.get(0) );
                  // System.out.println( PosList.get(i).ghostPos.get(1) );
            }
            
            optimal = findOptimal( PosList, grid );

            return PacUtils.direction( pacLoc, BFSPath.getPath( grid, pacLoc, optimal.pacPos ).remove(0) );

            //return null;
      }

      public List<Point> allPossibleMovesStart( Point loc, PacCell[][] grid, int de ) {

            List<Point> start = new ArrayList<Point>();
            start.add( loc );

            return allPossibleMoves( start, grid, de );
      }

      public List<Point> allPossibleMoves( List<Point> loc, PacCell[][] grid, int de ) {

            List<Point> moves;

            if (de == 0) { return loc; }

            moves = new ArrayList<Point>();

            for ( int i = 0; i < loc.size(); i++ ) {

                  for ( int j = 0; j < 4; j++ ) {

                        if ( checkSpot( loc.get(i).x + moveX[j], loc.get(i).y + moveY[j], grid ) ) {

                              moves.add( new Point( loc.get(i).x + moveX[j], loc.get(i).y + moveY[j] ) );
                        }
                  }
            }

            return allPossibleMoves( moves, grid, de - 1 );
      }

      //checks if the spot is valid for a pacman or a ghost to move to -- needs to be unoccupied or contain food/power
      public boolean checkSpot( int x, int y, PacCell[][] grid ) {

            return ( PacUtils.unoccupied( x , y, grid ) || PacUtils.goody( x, y, grid ) ); 
      }

      //scan through all possible Position to find the most optimal move for Pacman, return greatest
      public Position findOptimal( List<Position> posList, PacCell[][] grid ) {

            Position optimal = new Position();
            int max = 0;
            int current = 0;
            int foodDist;
            int zeroDist;
            int oneDist;

            System.out.println( posList.size() );
            for ( int i = 0; i < posList.size(); i++ ) {

                  //evaluation function (FREESTYLE)
                  //
                  //(-) distance of pacman to ghost => BFSPath.getPath( grid, posList.get(i).pacPos, posList.get(i).ghostPos.get(0 || 1) ).size()
                  //(+) distance of pacman to food => BFSPath.getPath( grid, posList.get(i).pacPos, PacUtils.nearestFood( posList.get(i).pacPos ) ).size()
                  //
                  //current = ...

                  zeroDist = BFSPath.getPath( grid, posList.get(i).pacPos, posList.get(i).ghostPos.get(0) ).size();
                  oneDist = BFSPath.getPath( grid, posList.get(i).pacPos, posList.get(i).ghostPos.get(1) ).size();
                  foodDist = BFSPath.getPath( grid, posList.get(i).pacPos, PacUtils.nearestFood( posList.get(i).pacPos, grid ) ).size();

                  current = foodDist + zeroDist + oneDist;
                  System.out.println( current );

                  if ( current > max ) {
                        
                        optimal = posList.get(i);
                        max = current;

                  }
            }

            System.out.println( optimal.pacPos );
            return optimal;
      }

      @Override
      public void init() {}

      @Override
      public PacFace action( Object state ) {

            PacCell[][] grid = (PacCell[][]) state;
            PacFace newFace = null;

            newFace = Minimax( grid );
            System.exit(0);

            return newFace;
      }
}